// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import {
  DEFAULT_BACKOFF_BASE_MS,
  DEFAULT_CONCURRENCY,
  DEFAULT_RETRIES,
  MAX_CONCURRENCY,
  MIN_CONCURRENCY,
} from '@constants/performance';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { getUserCancelledAbortErrorFromSignal } from '@shared/error/cancellation';
import { StreamingZipWriter } from '@shared/external/zip/streaming-zip-writer';
import { fetchArrayBufferWithRetry } from '@shared/network/retry-fetch';
import type { DownloadOptions, OrchestratorItem, ZipResult } from '@shared/services/download/types';
import { reportProgress } from '@shared/services/download/types';

type UniqueFilenameFactory = (desired: string) => string;

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
  const writer = new StreamingZipWriter();

  const concurrency = clampConcurrency(options.concurrency);
  const retries = clampRetries(options.retries);
  const abortSignal = options.signal;
  const onProgress = options.onProgress;

  throwIfAborted(abortSignal);

  const total = items.length;
  let processed = 0;
  let successful = 0;
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

      try {
        let data: Uint8Array;
        if (item.blob) {
          const blob = item.blob instanceof Promise ? await item.blob : item.blob;
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

        throwIfAborted(abortSignal);

        // Write immediately to ZIP — avoids holding all files in memory
        writer.addFile(filename, data);
        successful++;
      } catch (error) {
        throwIfAborted(abortSignal);
        failures.push({ url: item.url, error: normalizeErrorMessage(error) });
      } finally {
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
  };
}
