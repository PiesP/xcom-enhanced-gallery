// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { DOWNLOAD_PRE_ID_CANCELLATION_TTL_MS } from '@constants/performance';
import type { StorageAdapter } from '@platform/types';

const DOWNLOAD_TRACKING_STORAGE_KEY = 'xeg.download-tracking.v1';

export interface PersistedDownloadRecord {
  readonly downloadId?: number;
  readonly cancellationRequested: boolean;
  readonly cancellationRequestedAt?: number;
}

type StorageErrorHandler = (operation: 'read' | 'write', error: unknown) => void;

class DownloadTrackingStorageError extends Error {
  readonly operation: 'read' | 'write';

  constructor(operation: 'read' | 'write', cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(`Download tracking storage ${operation} failed: ${message}`, { cause });
    this.name = 'DownloadTrackingStorageError';
    this.operation = operation;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStoredRecords(
  value: unknown,
  nowMs: number
): { records: Map<string, PersistedDownloadRecord>; needsPersistence: boolean } {
  const records = new Map<string, PersistedDownloadRecord>();
  let needsPersistence = false;
  if (!isRecord(value)) return { records, needsPersistence };

  for (const [requestId, rawRecord] of Object.entries(value)) {
    if (!requestId || !isRecord(rawRecord)) continue;
    if (typeof rawRecord.cancellationRequested !== 'boolean') continue;

    const downloadId = rawRecord.downloadId;
    if (
      downloadId !== undefined &&
      (typeof downloadId !== 'number' || !Number.isInteger(downloadId) || downloadId < 0)
    ) {
      continue;
    }

    const rawCancellationRequestedAt = rawRecord.cancellationRequestedAt;
    const hasValidCancellationRequestedAt =
      rawCancellationRequestedAt === undefined ||
      (typeof rawCancellationRequestedAt === 'number' &&
        Number.isInteger(rawCancellationRequestedAt) &&
        rawCancellationRequestedAt >= 0);
    if (!hasValidCancellationRequestedAt) {
      needsPersistence = true;
      if (downloadId === undefined && rawRecord.cancellationRequested) continue;
    }

    let cancellationRequestedAt = hasValidCancellationRequestedAt
      ? rawCancellationRequestedAt
      : undefined;
    if (rawRecord.cancellationRequested && downloadId === undefined) {
      if (cancellationRequestedAt === undefined) {
        // Records written before the timestamp field existed get one bounded
        // grace period, then are normalized on the next successful write.
        cancellationRequestedAt = nowMs;
        needsPersistence = true;
      } else if (nowMs - cancellationRequestedAt >= DOWNLOAD_PRE_ID_CANCELLATION_TTL_MS) {
        needsPersistence = true;
        continue;
      }
    } else if (!rawRecord.cancellationRequested && rawCancellationRequestedAt !== undefined) {
      needsPersistence = true;
      cancellationRequestedAt = undefined;
    }

    records.set(requestId, {
      ...(typeof downloadId === 'number' ? { downloadId } : {}),
      cancellationRequested: rawRecord.cancellationRequested,
      ...(cancellationRequestedAt === undefined ? {} : { cancellationRequestedAt }),
    });
  }

  return { records, needsPersistence };
}

function isExpiredPreIdCancellation(record: PersistedDownloadRecord, nowMs: number): boolean {
  return (
    record.downloadId === undefined &&
    record.cancellationRequested &&
    record.cancellationRequestedAt !== undefined &&
    nowMs - record.cancellationRequestedAt >= DOWNLOAD_PRE_ID_CANCELLATION_TTL_MS
  );
}

/**
 * Persists only the request-to-download relationship and cancellation intent.
 * Runtime ownership and completion observers remain process-local; a new MV3
 * worker can rebuild those from this small recoverable record.
 */
export class DownloadTrackingStore {
  private readonly records = new Map<string, PersistedDownloadRecord>();
  private operationQueue: Promise<void> = Promise.resolve();
  private loaded = false;
  private dirty = false;

  constructor(
    private readonly storage: StorageAdapter,
    private readonly onStorageError: StorageErrorHandler = () => undefined,
    private readonly now: () => number = () => Date.now()
  ) {}

  async ready(): Promise<void> {
    await this.enqueue(async () => {
      await this.ensureLoaded();
    });
  }

  async reload(): Promise<ReadonlyArray<readonly [string, PersistedDownloadRecord]>> {
    return this.enqueue(async () => {
      // A failed write leaves the in-memory snapshot newer than storage. Do
      // not replace it with an older read while the state is still dirty.
      if (this.dirty) {
        await this.persist();
        return this.entries();
      }

      await this.loadFromStorage();
      if (this.dirty) await this.persist();
      return this.entries();
    });
  }

  get(requestId: string): PersistedDownloadRecord | undefined {
    return this.records.get(requestId);
  }

  entries(): ReadonlyArray<readonly [string, PersistedDownloadRecord]> {
    return [...this.records.entries()];
  }

  async registerRequest(requestId: string): Promise<void> {
    await this.enqueue(async () => {
      await this.ensureLoaded();
      if (!this.records.has(requestId)) {
        this.records.set(requestId, { cancellationRequested: false });
        await this.persist();
      }
    });
  }

  async bindDownload(requestId: string, downloadId: number): Promise<boolean> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      const current = this.records.get(requestId);
      const cancellationRequested =
        current?.cancellationRequested === true && !isExpiredPreIdCancellation(current, this.now());
      this.records.set(requestId, {
        downloadId,
        cancellationRequested,
        ...(cancellationRequested && current?.cancellationRequestedAt !== undefined
          ? { cancellationRequestedAt: current.cancellationRequestedAt }
          : {}),
      });
      await this.persist();
      return cancellationRequested;
    });
  }

  async requestCancellation(requestId: string): Promise<void> {
    await this.enqueue(async () => {
      await this.ensureLoaded();
      const current = this.records.get(requestId);
      const cancellationRequestedAt =
        current?.cancellationRequested === true &&
        current.cancellationRequestedAt !== undefined &&
        !isExpiredPreIdCancellation(current, this.now())
          ? current.cancellationRequestedAt
          : this.now();
      this.records.set(requestId, {
        ...(current?.downloadId === undefined ? {} : { downloadId: current.downloadId }),
        cancellationRequested: true,
        cancellationRequestedAt,
      });
      await this.persist();
    });
  }

  async remove(requestId: string): Promise<void> {
    await this.enqueue(async () => {
      await this.ensureLoaded();
      if (!this.records.delete(requestId)) return;
      await this.persist();
    });
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) await this.loadFromStorage();
    if (this.dirty) await this.persist();
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await this.storage.get<unknown>(DOWNLOAD_TRACKING_STORAGE_KEY);
      const parsed = parseStoredRecords(stored, this.now());
      this.records.clear();
      for (const [requestId, record] of parsed.records) {
        this.records.set(requestId, record);
      }
      this.loaded = true;
      this.dirty = parsed.needsPersistence;
    } catch (error: unknown) {
      this.reportStorageError('read', error);
      throw new DownloadTrackingStorageError('read', error);
    }
  }

  private async persist(): Promise<void> {
    const snapshot = Object.fromEntries(this.records.entries());
    this.dirty = true;
    try {
      await this.storage.set(DOWNLOAD_TRACKING_STORAGE_KEY, snapshot);
      this.dirty = false;
    } catch (error: unknown) {
      this.reportStorageError('write', error);
      throw new DownloadTrackingStorageError('write', error);
    }
  }

  private reportStorageError(operation: 'read' | 'write', error: unknown): void {
    try {
      this.onStorageError(operation, error);
    } catch {
      // Storage diagnostics must not replace the original persistence error.
    }
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation, operation);
    this.operationQueue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }
}
