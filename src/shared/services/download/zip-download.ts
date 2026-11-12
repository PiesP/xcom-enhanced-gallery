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
import {
  appendFilenameSuffix,
  finalizeFilename,
  getFilenameStemKey,
} from '@shared/core/filename/filename-utils';
import { schedulerYield } from '@piesp/browser-core/util';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { getUserCancelledAbortErrorFromSignal } from '@shared/error/cancellation';
import { DownloadSourceUnavailableError } from '@shared/error/download-source-unavailable-error';
import { isHttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';
import {
  StreamingZipWriter,
  type ZipEntryReservation,
  ZipResourceLimitError,
} from '@shared/external/zip/streaming-zip-writer';
import { fetchOwnedArrayBufferWithRetry, HttpStatusError } from '@shared/network/retry-fetch';
import { HttpRequestError } from '@shared/services/http-request-service';
import { endZipSpan, startZipSpan } from '@shared/services/download/zip-experiment-profiler';
import type {
  DownloadOptions,
  OrchestratorItem,
  ZipFailedEntry,
  ZipResult,
} from '@shared/services/download/types';
import { getZipInputKind, reportProgress } from '@shared/services/download/types';
import {
  combineLiveByteLeases,
  DownloadResourceLimitError,
  downloadLiveByteBudget,
  type LiveByteLease,
  type OwnedBlob,
} from './live-byte-budget';

type UniqueFilenameFactory = (desired: string, identitySuffix?: string) => string;

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
    if (signal?.aborted) {
      return Promise.reject(getUserCancelledAbortErrorFromSignal(signal));
    }

    return new Promise<ReleaseReservation>((resolve, reject) => {
      const waiter: ByteBudgetWaiter = { bytes, resolve, reject, signal };
      const onAbort = (): void => {
        const index = this.waiters.indexOf(waiter);
        if (index >= 0) {
          this.waiters.splice(index, 1);
        }
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
    if (!waiter || this.usedBytes + waiter.bytes > this.limitBytes) {
      return;
    }
    this.waiters.shift();
    if (waiter.signal && waiter.onAbort) {
      waiter.signal.removeEventListener('abort', waiter.onAbort);
    }
    this.usedBytes += waiter.bytes;
    this.onUsage?.(this.usedBytes);
    let released = false;
    waiter.resolve(() => {
      if (released) {
        return;
      }
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
  const usedStems = new Set<string>();
  const baseCounts = new Map<string, number>();
  return (requested: string, identitySuffix = ''): string => {
    const desired = finalizeFilename(requested);
    const baseKey = getFilenameStemKey(desired);
    const desiredKey = desired.toLowerCase();
    if (!usedNames.has(desiredKey) && !usedStems.has(baseKey)) {
      usedNames.add(desiredKey);
      usedStems.add(baseKey);
      baseCounts.set(baseKey, 0);
      return desired;
    }
    let count = baseCounts.get(baseKey) ?? 0;
    // Each progressing candidate can collide with at most one previously used stem.
    for (let attempts = 0; attempts <= usedStems.size; attempts++) {
      count += 1;
      const candidate = appendFilenameSuffix(desired, `-${count}`, identitySuffix);
      const nameKey = candidate.toLowerCase();
      const stemKey = getFilenameStemKey(candidate);
      if (!usedNames.has(nameKey) && !usedStems.has(stemKey)) {
        baseCounts.set(baseKey, count);
        usedNames.add(nameKey);
        usedStems.add(stemKey);
        return candidate;
      }
    }
    throw new RangeError('ZIP filename collisions could not be resolved');
  };
};

const clampConcurrency = (value: number | undefined): number => {
  const resolved = value ?? DEFAULT_CONCURRENCY;
  return Math.min(MAX_CONCURRENCY, Math.max(MIN_CONCURRENCY, resolved));
};

const clampRetries = (value: number | undefined): number => Math.max(0, value ?? DEFAULT_RETRIES);

const resolvePositiveByteLimit = (value: number | undefined, fallback: number): number => {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
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
  const assignedFilenames = items.map((item) =>
    ensureUniqueFilename(item.desiredName, item.identitySuffix)
  );
  // EOCD plus its final Blob snapshot are admitted before the writer can allocate them.
  partLeases.push(liveBudget.reserve(22));
  try {
    blobLeases.push(liveBudget.reserve(22));
  } catch (error) {
    for (const lease of partLeases) {
      lease.release();
    }
    throw error;
  }
  const total = items.length;
  let processed = 0;
  let successful = 0;
  let resourceLimitExceeded = false;
  let sourceUnavailable = false;
  const sourceFetchStatuses = new Set<number>();
  const failures: { url: string; error: string }[] = [];
  const failedEntries: ZipFailedEntry[] = [];
  let currentIndex = 0;

  const runNext = async (): Promise<void> => {
    while (currentIndex < total) {
      throwIfAborted(abortSignal);
      const index = currentIndex++;
      const item = items[index];
      if (!item) {
        continue;
      }
      const filename = assignedFilenames[index] ?? item.desiredName;
      let releaseWorker: ReleaseReservation | undefined;
      let archiveReservation: ZipEntryReservation | undefined;
      let overhead: LiveByteLease | undefined;
      let blobOverhead: LiveByteLease | undefined;
      let futureBlob: LiveByteLease | undefined;
      let body: LiveByteLease | undefined;
      let borrowed: OwnedBlob | undefined;
      try {
        if (item.sourceUnavailable && !item.blob) {
          throw new DownloadSourceUnavailableError();
        }
        const supplied = item.blob && !(item.blob instanceof Promise) ? item.blob : undefined;
        const knownSize = supplied ? supplied.value.size : item.expectedSizeBytes;
        if (knownSize !== undefined && knownSize > maxEntryBytes) {
          throw new ZipResourceLimitError(
            `Bulk ZIP limit exceeded: ${filename} is ${knownSize} bytes (limit ${maxEntryBytes})`
          );
        }
        const workerWaitStartedMs = startZipSpan();
        releaseWorker = await workerBudget.reserve(
          supplied ? Math.max(1, supplied.value.size) : maxBufferedBytes,
          abortSignal
        );
        endZipSpan('worker-admission-wait', workerWaitStartedMs);
        const entryAdmissionStartedMs = startZipSpan();
        // Conservative UTF-8/header/directory scratch and the corresponding Blob copy.
        // Admit before encodeUtf8/reserveEntry; string lengths are already bounded by the planner.
        overhead = liveBudget.reserve(256 + filename.length * 8);
        blobOverhead = liveBudget.reserve(256 + filename.length * 8);
        const inputKind = getZipInputKind(item);
        const usesBlob = inputKind !== 'direct-url';
        // Chunks + response copy + final archive copy (and Blob-to-buffer copy for providers).
        const liveEntryCap = Math.min(
          maxEntryBytes,
          supplied
            ? supplied.value.size
            : Math.floor(liveBudget.availableBytes / (usesBlob ? 4 : 3))
        );
        if (knownSize !== undefined && knownSize > liveEntryCap) {
          throw new DownloadResourceLimitError();
        }
        if (liveEntryCap === 0 && knownSize !== 0) {
          throw new DownloadResourceLimitError();
        }
        archiveReservation = writer.reserveEntry(filename, liveEntryCap);
        const remainingEntryBytes = Math.min(liveEntryCap, archiveReservation.maxDataBytes);
        if (knownSize !== undefined && knownSize > remainingEntryBytes) {
          throw new ZipResourceLimitError(
            `Bulk ZIP limit exceeded: ${filename} has insufficient remaining archive capacity`
          );
        }
        if (remainingEntryBytes === 0 && knownSize !== 0) {
          throw new ZipResourceLimitError(
            `Bulk ZIP limit exceeded: no data capacity remains for ${filename}`
          );
        }
        options.onEntryAdmission?.({
          index,
          inputKind,
          maxResponseBytes: remainingEntryBytes,
          ...(knownSize !== undefined ? { knownSize } : {}),
        });
        futureBlob = liveBudget.reserve(remainingEntryBytes);
        endZipSpan('entry-admission', entryAdmissionStartedMs, remainingEntryBytes);
        let data: Uint8Array;
        if (usesBlob) {
          // Reserve arrayBuffer's distinct storage before invoking a provider or copying a Blob.
          body = liveBudget.reserve(remainingEntryBytes);
          let blob: Blob | undefined;
          const providerStartedMs = startZipSpan();
          const providerPhase = item.blob ? 'owned-blob-wait' : 'provider-wait';
          try {
            if (item.blob) {
              const owner = item.blob instanceof Promise ? await item.blob : item.blob;
              borrowed = { value: owner.value, lease: owner.lease.fork() };
              blob = borrowed.value;
            } else {
              borrowed = (await item.getBlob?.(abortSignal, remainingEntryBytes)) ?? undefined;
              blob = borrowed?.value;
            }
            endZipSpan(providerPhase, providerStartedMs, blob?.size ?? 0);
          } catch (error) {
            endZipSpan(providerPhase, providerStartedMs);
            throwIfAborted(abortSignal);
            // Only a resolved cache/provider miss permits URL fallback. A
            // rejected request may already be denied, rate-limited or active.
            throw error;
          }
          if (blob) {
            throwIfAborted(abortSignal);
            if (blob.size > remainingEntryBytes) {
              throw new ZipResourceLimitError(
                `Bulk ZIP limit exceeded: ${filename} is ${blob.size} bytes (remaining ${remainingEntryBytes})`
              );
            }
            const materializeStartedMs = startZipSpan();
            data = new Uint8Array(await blob.arrayBuffer());
            endZipSpan('blob-array-buffer', materializeStartedMs, data.byteLength);
            body.shrink(data.byteLength);
          } else {
            body.release();
            body = undefined;
            const fetchStartedMs = startZipSpan();
            const fetched = await fetchOwnedArrayBufferWithRetry(
              item.url,
              retries,
              abortSignal,
              DEFAULT_BACKOFF_BASE_MS,
              remainingEntryBytes,
              liveBudget
            );
            data = fetched.value;
            endZipSpan('network-fetch', fetchStartedMs, data.byteLength);
            body = fetched.lease;
          }
        } else {
          const fetchStartedMs = startZipSpan();
          const fetched = await fetchOwnedArrayBufferWithRetry(
            item.url,
            retries,
            abortSignal,
            DEFAULT_BACKOFF_BASE_MS,
            remainingEntryBytes,
            liveBudget
          );
          data = fetched.value;
          endZipSpan('network-fetch', fetchStartedMs, data.byteLength);
          body = fetched.lease;
        }
        throwIfAborted(abortSignal);
        if (data.byteLength > remainingEntryBytes) {
          throw new ZipResourceLimitError(
            `Bulk ZIP limit exceeded: ${filename} is ${data.byteLength} bytes (remaining ${remainingEntryBytes})`
          );
        }
        futureBlob.shrink(data.byteLength);
        if (index > 0) {
          const yieldStartedMs = startZipSpan();
          await schedulerYield();
          endZipSpan('precommit-yield', yieldStartedMs);
        }
        const commitStartedMs = startZipSpan();
        await archiveReservation.commit(data, abortSignal ? { signal: abortSignal } : {});
        endZipSpan('commit-total', commitStartedMs, data.byteLength);
        partLeases.push(body, overhead);
        blobLeases.push(futureBlob, blobOverhead);
        body = undefined;
        futureBlob = undefined;
        overhead = undefined;
        blobOverhead = undefined;
        successful++;
      } catch (error) {
        throwIfAborted(abortSignal);
        if (error instanceof DownloadSourceUnavailableError) {
          sourceUnavailable = true;
        }
        if (
          (error instanceof HttpRequestError || error instanceof HttpStatusError) &&
          error.category === 'http' &&
          error.status >= 400 &&
          error.status <= 599
        ) {
          sourceFetchStatuses.add(error.status);
        }
        if (
          error instanceof ZipResourceLimitError ||
          isHttpResponseSizeLimitError(error) ||
          error instanceof DownloadResourceLimitError
        ) {
          resourceLimitExceeded = true;
        }
        const message = normalizeErrorMessage(error);
        failures.push({ url: item.url, error: message });
        failedEntries.push({ index, url: item.url, filename, error: message });
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
    for (const lease of [...partLeases, ...blobLeases]) {
      lease.release();
    }
    throw rejected.reason;
  }
  let parts: BlobPart[];
  try {
    reportProgress(onProgress, { phase: 'complete', current: processed, total, percentage: 100 });
    parts = writer.finalize();
  } catch (error) {
    writer.dispose();
    for (const lease of [...partLeases, ...blobLeases]) {
      lease.release();
    }
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
    failedEntries: failedEntries.sort((a, b) => a.index - b.index),
    zipData: parts,
    resourceLimitExceeded,
    sourceUnavailable,
    ...(sourceFetchStatuses.size > 0
      ? { sourceFetchStatuses: [...sourceFetchStatuses].sort((a, b) => a - b) }
      : {}),
    createBlob: () => {
      if (transferred || disposed) {
        throw new Error('ZIP ownership is no longer available');
      }
      // Future Blob capacity was reserved before reading every accepted entry.
      const blobStartedMs = startZipSpan();
      const value = new Blob(parts, { type: 'application/zip' });
      transferred = true;
      dropParts();
      partOwner.release();
      blobOwner.shrink(value.size);
      endZipSpan('blob-create', blobStartedMs, value.size);
      return { value, lease: blobOwner };
    },
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      dropParts();
      partOwner.release();
      if (!transferred) {
        blobOwner.release();
      }
    },
  };
}
