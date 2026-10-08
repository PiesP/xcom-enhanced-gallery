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
import { schedulerYield } from '@piesp/browser-core/util';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { getUserCancelledAbortErrorFromSignal } from '@shared/error/cancellation';
import { isHttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';
import {
  StreamingZipWriter,
  type ZipEntryReservation,
  ZipResourceLimitError,
} from '@shared/external/zip/streaming-zip-writer';
import { fetchOwnedArrayBufferWithRetry } from '@shared/network/retry-fetch';
import type { DownloadOptions, OrchestratorItem, ZipResult } from '@shared/services/download/types';
import { reportProgress } from '@shared/services/download/types';
import {
  combineLiveByteLeases,
  DownloadResourceLimitError,
  downloadLiveByteBudget,
  type LiveByteLease,
  type OwnedBlob,
} from './live-byte-budget';

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

/** Assemble stored ZIP entries while retaining binary and future Blob-copy reservations. */
export async function downloadAsZip(
  items: readonly OrchestratorItem[],
  options: DownloadOptions = {}
): Promise<ZipResult> {
  const concurrency = clampConcurrency(options.concurrency);
  const retries = clampRetries(options.retries);
  const abortSignal = options.signal;
  const onProgress = options.onProgress;
  const liveBudget = options.liveBudget ?? downloadLiveByteBudget;
  const maxBufferedBytes = resolvePositiveByteLimit(
    options.maxBufferedBytes,
    ZIP_BUFFER_BUDGET_BYTES
  );
  const maxEntryBytes = Math.min(
    maxBufferedBytes,
    resolvePositiveByteLimit(options.maxEntryBytes, ZIP_MAX_ENTRY_BYTES)
  );
  const writer = new StreamingZipWriter(
    resolvePositiveByteLimit(options.maxArchiveBytes, ZIP_MAX_ARCHIVE_BYTES)
  );
  // This queue controls worker admission only. Committed storage remains in liveBudget.
  const workerBudget = new RetainedByteBudget(maxBufferedBytes, options.onBufferUsage);
  const partLeases: LiveByteLease[] = [];
  const blobLeases: LiveByteLease[] = [];
  throwIfAborted(abortSignal);
  const ensureUniqueFilename = ensureUniqueFilenameFactory();
  const assignedFilenames = items.map((item) => ensureUniqueFilename(item.desiredName));
  // EOCD plus its final Blob snapshot are admitted before the writer can allocate them.
  partLeases.push(liveBudget.reserve(22));
  try {
    blobLeases.push(liveBudget.reserve(22));
  } catch (error) {
    for (const lease of partLeases) lease.release();
    throw error;
  }
  const total = items.length;
  let processed = 0;
  let successful = 0;
  let resourceLimitExceeded = false;
  const failures: { url: string; error: string }[] = [];
  let currentIndex = 0;

  const runNext = async (): Promise<void> => {
    while (currentIndex < total) {
      throwIfAborted(abortSignal);
      const index = currentIndex++;
      const item = items[index];
      if (!item) continue;
      const filename = assignedFilenames[index] ?? item.desiredName;
      let releaseWorker: ReleaseReservation | undefined;
      let archiveReservation: ZipEntryReservation | undefined;
      let overhead: LiveByteLease | undefined;
      let blobOverhead: LiveByteLease | undefined;
      let futureBlob: LiveByteLease | undefined;
      let body: LiveByteLease | undefined;
      let borrowed: OwnedBlob | undefined;
      try {
        const supplied = item.blob && !(item.blob instanceof Promise) ? item.blob : undefined;
        const knownSize = supplied ? supplied.value.size : item.expectedSizeBytes;
        if (knownSize !== undefined && knownSize > maxEntryBytes) {
          throw new ZipResourceLimitError(
            `Bulk ZIP limit exceeded: ${filename} is ${knownSize} bytes (limit ${maxEntryBytes})`
          );
        }
        releaseWorker = await workerBudget.reserve(
          supplied ? Math.max(1, supplied.value.size) : maxBufferedBytes,
          abortSignal
        );
        // Conservative UTF-8/header/directory scratch and the corresponding Blob copy.
        // Admit before encodeUtf8/reserveEntry; string lengths are already bounded by the planner.
        overhead = liveBudget.reserve(256 + filename.length * 8);
        blobOverhead = liveBudget.reserve(256 + filename.length * 8);
        const usesBlob = !!(item.blob || item.getBlob);
        // Chunks + response copy + final archive copy (and Blob-to-buffer copy for providers).
        const liveEntryCap = Math.min(
          maxEntryBytes,
          supplied
            ? supplied.value.size
            : Math.floor(liveBudget.availableBytes / (usesBlob ? 4 : 3))
        );
        if (knownSize !== undefined && knownSize > liveEntryCap)
          throw new DownloadResourceLimitError();
        if (liveEntryCap === 0 && knownSize !== 0) throw new DownloadResourceLimitError();
        archiveReservation = writer.reserveEntry(filename, liveEntryCap);
        const remainingEntryBytes = Math.min(liveEntryCap, archiveReservation.maxDataBytes);
        if (knownSize !== undefined && knownSize > remainingEntryBytes)
          throw new ZipResourceLimitError(
            `Bulk ZIP limit exceeded: ${filename} has insufficient remaining archive capacity`
          );
        if (remainingEntryBytes === 0 && knownSize !== 0)
          throw new ZipResourceLimitError(
            `Bulk ZIP limit exceeded: no data capacity remains for ${filename}`
          );
        futureBlob = liveBudget.reserve(remainingEntryBytes);
        let data: Uint8Array;
        if (usesBlob) {
          // Reserve arrayBuffer's distinct storage before invoking a provider or copying a Blob.
          body = liveBudget.reserve(remainingEntryBytes);
          let blob: Blob | undefined;
          try {
            if (item.blob) {
              const owner = item.blob instanceof Promise ? await item.blob : item.blob;
              borrowed = { value: owner.value, lease: owner.lease.fork() };
              blob = borrowed.value;
            } else {
              borrowed = (await item.getBlob?.(abortSignal, remainingEntryBytes)) ?? undefined;
              blob = borrowed?.value;
            }
          } catch (error) {
            throwIfAborted(abortSignal);
            // A size/memory rejection must never start another whole-body fallback.
            if (isHttpResponseSizeLimitError(error) || error instanceof DownloadResourceLimitError)
              throw error;
          }
          if (blob) {
            throwIfAborted(abortSignal);
            if (blob.size > remainingEntryBytes)
              throw new ZipResourceLimitError(
                `Bulk ZIP limit exceeded: ${filename} is ${blob.size} bytes (remaining ${remainingEntryBytes})`
              );
            data = new Uint8Array(await blob.arrayBuffer());
            body.shrink(data.byteLength);
          } else {
            body.release();
            body = undefined;
            const fetched = await fetchOwnedArrayBufferWithRetry(
              item.url,
              retries,
              abortSignal,
              DEFAULT_BACKOFF_BASE_MS,
              remainingEntryBytes,
              liveBudget
            );
            data = fetched.value;
            body = fetched.lease;
          }
        } else {
          const fetched = await fetchOwnedArrayBufferWithRetry(
            item.url,
            retries,
            abortSignal,
            DEFAULT_BACKOFF_BASE_MS,
            remainingEntryBytes,
            liveBudget
          );
          data = fetched.value;
          body = fetched.lease;
        }
        throwIfAborted(abortSignal);
        if (data.byteLength > remainingEntryBytes)
          throw new ZipResourceLimitError(
            `Bulk ZIP limit exceeded: ${filename} is ${data.byteLength} bytes (remaining ${remainingEntryBytes})`
          );
        futureBlob.shrink(data.byteLength);
        if (index > 0) await schedulerYield();
        await archiveReservation.commit(data, abortSignal ? { signal: abortSignal } : {});
        partLeases.push(body, overhead);
        blobLeases.push(futureBlob, blobOverhead);
        body = undefined;
        futureBlob = undefined;
        overhead = undefined;
        blobOverhead = undefined;
        successful++;
      } catch (error) {
        throwIfAborted(abortSignal);
        if (
          error instanceof ZipResourceLimitError ||
          isHttpResponseSizeLimitError(error) ||
          error instanceof DownloadResourceLimitError
        )
          resourceLimitExceeded = true;
        failures.push({ url: item.url, error: normalizeErrorMessage(error) });
      } finally {
        borrowed?.lease.release();
        body?.release();
        futureBlob?.release();
        overhead?.release();
        blobOverhead?.release();
        archiveReservation?.release();
        releaseWorker?.();
        processed++;
        reportProgress(onProgress, { phase: 'downloading', current: processed, total, filename });
      }
    }
  };
  const workers = Array.from({ length: Math.min(concurrency, total) }, () => runNext());
  // An abort must wait for every worker's actual copy/commit cleanup before dropping writer parts.
  const settled = await Promise.allSettled(workers);
  const rejected = settled.find((result) => result.status === 'rejected');
  if (rejected?.status === 'rejected') {
    writer.dispose();
    for (const lease of [...partLeases, ...blobLeases]) lease.release();
    throw rejected.reason;
  }
  let parts: BlobPart[];
  try {
    reportProgress(onProgress, { phase: 'complete', current: processed, total, percentage: 100 });
    parts = writer.finalize();
  } catch (error) {
    writer.dispose();
    for (const lease of [...partLeases, ...blobLeases]) lease.release();
    throw error;
  }
  const partOwner = combineLiveByteLeases(partLeases);
  const blobOwner = combineLiveByteLeases(blobLeases);
  let transferred = false;
  let disposed = false;
  const dropParts = (): void => {
    parts.length = 0;
    writer.dispose();
  };
  return {
    filesSuccessful: successful,
    failures,
    zipData: parts,
    resourceLimitExceeded,
    createBlob: () => {
      if (transferred || disposed) throw new Error('ZIP ownership is no longer available');
      // Future Blob capacity was reserved before reading every accepted entry.
      const value = new Blob(parts, { type: 'application/zip' });
      transferred = true;
      dropParts();
      partOwner.release();
      blobOwner.shrink(value.size);
      return { value, lease: blobOwner };
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      dropParts();
      partOwner.release();
      if (!transferred) blobOwner.release();
    },
  };
}
