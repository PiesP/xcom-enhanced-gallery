// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import {
  DEFAULT_BACKOFF_BASE_MS,
  DEFAULT_CONCURRENCY,
  DEFAULT_RETRIES,
  MAX_CONCURRENCY,
  MIN_CONCURRENCY,
  ZIP_BUFFER_BUDGET_BYTES,
  ZIP_MAX_ARCHIVE_BYTES,
  ZIP_MAX_ENTRY_BYTES,
} from '@constants/performance';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { getUserCancelledAbortErrorFromSignal } from '@shared/error/cancellation';
import {
  StreamingZipWriter,
  ZipResourceLimitError,
} from '@shared/external/zip/streaming-zip-writer';
import { fetchArrayBufferWithRetry } from '@shared/network/retry-fetch';
import type { DownloadOptions, OrchestratorItem, ZipResult } from '@shared/services/download/types';
import { reportProgress } from '@shared/services/download/types';
import { schedulerYield } from '@shared/utils/performance/scheduler-yield';

type UniqueFilenameFactory = (desired: string) => string;

type ReleaseReservation = () => void;

interface ByteBudgetWaiter {
  readonly bytes: number;
  readonly resolve: (release: ReleaseReservation) => void;
  readonly reject: (reason: unknown) => void;
  readonly signal?: AbortSignal | undefined;
  onAbort?: (() => void) | undefined;
}

class RetainedByteBudget {
  private usedBytes = 0;
  private readonly waiters: ByteBudgetWaiter[] = [];

  constructor(
    private readonly limitBytes: number,
    private readonly onUsage?: ((bufferedBytes: number) => void) | undefined
  ) {}

  reserve(bytes: number, signal?: AbortSignal): Promise<ReleaseReservation> {
    if (bytes > this.limitBytes) {
      return Promise.reject(
        new ZipResourceLimitError(
          `Bulk ZIP limit exceeded: media requires ${bytes} buffered bytes (limit ${this.limitBytes})`
        )
      );
    }
    if (signal?.aborted) return Promise.reject(getUserCancelledAbortErrorFromSignal(signal));

    return new Promise<ReleaseReservation>((resolve, reject) => {
      const waiter: ByteBudgetWaiter = { bytes, resolve, reject, signal };
      const onAbort = (): void => {
        const index = this.waiters.indexOf(waiter);
        if (index >= 0) this.waiters.splice(index, 1);
        reject(getUserCancelledAbortErrorFromSignal(signal));
      };
      this.waiters.push(waiter);
      if (signal) {
        waiter.onAbort = onAbort;
        signal.addEventListener('abort', onAbort, { once: true });
        if (signal.aborted) {
          onAbort();
          return;
        }
      }
      this.drain();
    });
  }

  private drain(): void {
    const waiter = this.waiters[0];
    if (!waiter || this.usedBytes + waiter.bytes > this.limitBytes) return;
    this.waiters.shift();
    if (waiter.signal && waiter.onAbort) {
      waiter.signal.removeEventListener('abort', waiter.onAbort);
    }
    this.usedBytes += waiter.bytes;
    this.onUsage?.(this.usedBytes);
    let released = false;
    waiter.resolve(() => {
      if (released) return;
      released = true;
      this.usedBytes -= waiter.bytes;
      this.onUsage?.(this.usedBytes);
      this.drain();
    });
    this.drain();
  }
}

const ensureUniqueFilenameFactory = (): UniqueFilenameFactory => {
  const usedNames = new Set<string>();
  const baseCounts = new Map<string, number>();
  return (desired: string): string => {
    if (!usedNames.has(desired)) {
      usedNames.add(desired);
      baseCounts.set(desired, 0);
      return desired;
    }
    const lastDot = desired.lastIndexOf('.');
    const name = lastDot > 0 ? desired.slice(0, lastDot) : desired;
    const ext = lastDot > 0 ? desired.slice(lastDot) : '';
    const baseKey = desired;
    let count = baseCounts.get(baseKey) ?? 0;
    let candidate = '';
    do {
      count += 1;
      candidate = `${name}-${count}${ext}`;
    } while (usedNames.has(candidate));
    baseCounts.set(baseKey, count);
    usedNames.add(candidate);
    return candidate;
  };
};

const clampConcurrency = (value: number | undefined): number => {
  const resolved = value ?? DEFAULT_CONCURRENCY;
  return Math.min(MAX_CONCURRENCY, Math.max(MIN_CONCURRENCY, resolved));
};

const clampRetries = (value: number | undefined): number => Math.max(0, value ?? DEFAULT_RETRIES);

const resolvePositiveByteLimit = (value: number | undefined, fallback: number): number => {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.floor(value));
};

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    throw getUserCancelledAbortErrorFromSignal(signal);
  }
};

/**
 * Download multiple media items as a ZIP archive using parallel fetch workers.
 * Each completed file is written to the ZIP writer immediately to minimize
 * peak memory usage — only one file's data is buffered beyond the fetch buffer
 * at any time, instead of holding all files in memory before writing.
 *
 * @param items - Media items to download
 * @param options - Download options (concurrency, retries, signal, progress)
 * @returns ZIP result with file success/failure counts and binary data
 */
export async function downloadAsZip(
  items: readonly OrchestratorItem[],
  options: DownloadOptions = {}
): Promise<ZipResult> {
  const concurrency = clampConcurrency(options.concurrency);
  const retries = clampRetries(options.retries);
  const abortSignal = options.signal;
  const onProgress = options.onProgress;
  const maxBufferedBytes = resolvePositiveByteLimit(
    options.maxBufferedBytes,
    ZIP_BUFFER_BUDGET_BYTES
  );
  const maxEntryBytes = Math.min(
    maxBufferedBytes,
    resolvePositiveByteLimit(options.maxEntryBytes, ZIP_MAX_ENTRY_BYTES)
  );
  const maxArchiveBytes = resolvePositiveByteLimit(options.maxArchiveBytes, ZIP_MAX_ARCHIVE_BYTES);
  const writer = new StreamingZipWriter(maxArchiveBytes);
  const byteBudget = new RetainedByteBudget(maxBufferedBytes, options.onBufferUsage);

  throwIfAborted(abortSignal);

  const total = items.length;
  let processed = 0;
  let successful = 0;
  let resourceLimitExceeded = false;
  const failures: { url: string; error: string }[] = [];

  const ensureUniqueFilename = ensureUniqueFilenameFactory();
  const assignedFilenames = items.map((item) => ensureUniqueFilename(item.desiredName));

  // Track which indices have been written to preserve ordering info for progress
  let currentIndex = 0;

  const runNext = async (): Promise<void> => {
    while (currentIndex < total) {
      throwIfAborted(abortSignal);

      const index = currentIndex++;
      const item = items[index];
      if (!item) continue;

      const filename = assignedFilenames[index] ?? item.desiredName;
      let releaseReservation: ReleaseReservation | undefined;

      try {
        const knownSize = item.blob instanceof Blob ? item.blob.size : item.expectedSizeBytes;
        if (knownSize !== undefined && knownSize > maxEntryBytes) {
          throw new ZipResourceLimitError(
            `Bulk ZIP limit exceeded: ${filename} is ${knownSize} bytes (limit ${maxEntryBytes})`
          );
        }
        // Unknown-size providers reserve the full budget before fetching, so they
        // cannot leave multiple whole response buffers waiting for the writer.
        const reservationBytes =
          item.blob instanceof Blob ? Math.max(1, item.blob.size) : maxBufferedBytes;
        releaseReservation = await byteBudget.reserve(reservationBytes, abortSignal);

        let data: Uint8Array;
        if (item.blob || item.getBlob) {
          // Try the demand-driven cache first; fall back to network on failure
          let blob: Blob | undefined;
          try {
            const provided = item.blob ?? item.getBlob?.(abortSignal) ?? undefined;
            blob = provided instanceof Promise ? await provided : provided;
          } catch {
            throwIfAborted(abortSignal);
            // Cache request failed or expired — fall through to network
          }

          if (blob) {
            throwIfAborted(abortSignal);
            data = new Uint8Array(await blob.arrayBuffer());
          } else {
            data = await fetchArrayBufferWithRetry(
              item.url,
              retries,
              abortSignal,
              DEFAULT_BACKOFF_BASE_MS
            );
          }
        } else {
          data = await fetchArrayBufferWithRetry(
            item.url,
            retries,
            abortSignal,
            DEFAULT_BACKOFF_BASE_MS
          );
        }

        throwIfAborted(abortSignal);
        if (data.byteLength > maxEntryBytes) {
          throw new ZipResourceLimitError(
            `Bulk ZIP limit exceeded: ${filename} is ${data.byteLength} bytes (limit ${maxEntryBytes})`
          );
        }

        // Yield to main thread between items to keep UI responsive
        if (index > 0) {
          await schedulerYield(0);
        }

        // Write immediately to ZIP — avoids holding all files in memory
        await writer.addFile(filename, data, abortSignal ? { signal: abortSignal } : {});
        successful++;
      } catch (error) {
        throwIfAborted(abortSignal);
        if (error instanceof ZipResourceLimitError) resourceLimitExceeded = true;
        failures.push({ url: item.url, error: normalizeErrorMessage(error) });
      } finally {
        releaseReservation?.();
        processed++;
        reportProgress(onProgress, {
          phase: 'downloading',
          current: processed,
          total,
          filename,
        });
      }
    }
  };

  const workerCount = Math.min(concurrency, total);
  const workers = Array.from({ length: workerCount }, () => runNext());
  await Promise.all(workers);

  reportProgress(onProgress, {
    phase: 'complete',
    current: processed,
    total,
    percentage: 100,
  });

  const zipBytes = writer.finalize();

  return {
    filesSuccessful: successful,
    failures,
    zipData: zipBytes,
    resourceLimitExceeded,
  };
}
