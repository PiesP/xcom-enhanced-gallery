// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { StorageAdapter } from '@platform/types';

const DOWNLOAD_TRACKING_STORAGE_KEY = 'xeg.download-tracking.v1';

export interface PersistedDownloadRecord {
  readonly downloadId?: number;
  readonly cancellationRequested: boolean;
}

type StorageErrorHandler = (operation: 'read' | 'write', error: unknown) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStoredRecords(value: unknown): Map<string, PersistedDownloadRecord> {
  const records = new Map<string, PersistedDownloadRecord>();
  if (!isRecord(value)) return records;

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

    records.set(requestId, {
      ...(typeof downloadId === 'number' ? { downloadId } : {}),
      cancellationRequested: rawRecord.cancellationRequested,
    });
  }

  return records;
}

/**
 * Persists only the request-to-download relationship and cancellation intent.
 * Runtime ownership and completion observers remain process-local; a new MV3
 * worker can rebuild those from this small recoverable record.
 */
export class DownloadTrackingStore {
  private readonly records = new Map<string, PersistedDownloadRecord>();
  private readonly readyPromise: Promise<void>;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly storage: StorageAdapter,
    private readonly onStorageError: StorageErrorHandler = () => undefined
  ) {
    this.readyPromise = this.load();
  }

  async ready(): Promise<void> {
    await this.readyPromise;
  }

  async reload(): Promise<ReadonlyArray<readonly [string, PersistedDownloadRecord]>> {
    await this.ready();
    await this.load();
    return this.entries();
  }

  get(requestId: string): PersistedDownloadRecord | undefined {
    return this.records.get(requestId);
  }

  entries(): ReadonlyArray<readonly [string, PersistedDownloadRecord]> {
    return [...this.records.entries()];
  }

  async registerRequest(requestId: string): Promise<void> {
    await this.ready();
    if (!this.records.has(requestId)) {
      this.records.set(requestId, { cancellationRequested: false });
      await this.persist();
    }
  }

  async bindDownload(requestId: string, downloadId: number): Promise<boolean> {
    await this.ready();
    const cancellationRequested = this.records.get(requestId)?.cancellationRequested ?? false;
    this.records.set(requestId, { downloadId, cancellationRequested });
    await this.persist();
    return cancellationRequested;
  }

  async requestCancellation(requestId: string): Promise<void> {
    await this.ready();
    const current = this.records.get(requestId);
    this.records.set(requestId, {
      ...(current?.downloadId === undefined ? {} : { downloadId: current.downloadId }),
      cancellationRequested: true,
    });
    await this.persist();
  }

  async remove(requestId: string): Promise<void> {
    await this.ready();
    if (!this.records.delete(requestId)) return;
    await this.persist();
  }

  private async load(): Promise<void> {
    try {
      const stored = await this.storage.get<unknown>(DOWNLOAD_TRACKING_STORAGE_KEY);
      this.records.clear();
      for (const [requestId, record] of parseStoredRecords(stored)) {
        this.records.set(requestId, record);
      }
    } catch (error: unknown) {
      this.onStorageError('read', error);
    }
  }

  private async persist(): Promise<void> {
    const snapshot = Object.fromEntries(this.records.entries());
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        await this.storage.set(DOWNLOAD_TRACKING_STORAGE_KEY, snapshot);
      } catch (error: unknown) {
        this.onStorageError('write', error);
      }
    });
    await this.writeQueue;
  }
}
