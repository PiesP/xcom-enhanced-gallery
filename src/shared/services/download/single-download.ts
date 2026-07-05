// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { DEFAULT_REQUEST_TIMEOUT_MS } from '@constants/performance';
import { getDownloadAdapter } from '@platform/index';
import type { DownloadAdapter } from '@platform/types';
import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import type { DownloadOptions, SingleDownloadResult } from '@shared/services/download/types';
import { reportProgress } from '@shared/services/download/types';
import type { MediaInfo } from '@shared/types/media.types';

// Removed: detectDownloadCapability (duplicated platform detection logic).
// Use getDownloadAdapter() from platform layer instead.

import { USER_CANCELLED_MESSAGE } from '@shared/error/cancellation';

const createAbortResult = (): SingleDownloadResult => ({
  success: false,
  error: USER_CANCELLED_MESSAGE,
});

const createErrorDownloadResult = (error: unknown): SingleDownloadResult => ({
  success: false,
  error: normalizeErrorMessage(error),
});

/**
 * Race a work promise against an AbortSignal, automatically cleaning up
 * abort listeners when either the work or the abort wins the race.
 * Prevents listener leaks when the caller's AbortSignal outlives the
 * operation (e.g., a long-lived orchestrator signal reused across downloads).
 *
 * @param work - Promise representing the actual work (with handlers attached)
 * @param signal - AbortSignal to race against
 * @param onAborted - Factory for the result when the abort wins
 * @returns The work result or the abort result
 */
async function raceWithAbort<T>(
  work: Promise<T>,
  signal: AbortSignal,
  onAborted: () => T
): Promise<T> {
  if (signal.aborted) return onAborted();

  const cleanupController = new AbortController();
  signal.addEventListener('abort', () => cleanupController.abort(), {
    once: true,
    signal: cleanupController.signal,
  });

  const abortPromise = new Promise<T>((resolve) => {
    cleanupController.signal.addEventListener(
      'abort',
      () => {
        if (signal.aborted) resolve(onAborted());
      },
      { once: true }
    );
  });

  const result = await Promise.race([work.finally(() => cleanupController.abort()), abortPromise]);

  // Extra safety: ensure listener removal even on simultaneous settlement
  cleanupController.abort();
  return result;
}

export async function downloadSingleFile(
  media: MediaInfo,
  options: DownloadOptions = {}
): Promise<SingleDownloadResult> {
  const abortSignal = options.signal;
  if (abortSignal?.aborted) return createAbortResult();

  const filename = generateMediaFilename(media, { nowMs: Date.now() });

  if (options.blob) {
    return downloadBlobWithAdapter(options.blob, filename, abortSignal);
  }

  return downloadWithAdapter(media.url, filename, options, abortSignal);
}

async function downloadWithAdapter(
  url: string,
  filename: string,
  options: DownloadOptions,
  abortSignal: AbortSignal | undefined
): Promise<SingleDownloadResult> {
  const adapter = getDownloadAdapter();

  // Adapter needs blob-based fallback (MV3: content script fetch required)
  if (adapter.needsBlobFallback()) {
    return downloadWithFetchFallback(url, filename, options, abortSignal, adapter);
  }

  // Set up abort listener to race against the adapter download
  if (abortSignal) {
    return raceWithAbort(
      adapter.download(url, filename).then(
        () => {
          reportProgress(options.onProgress, {
            phase: 'complete',
            current: 1,
            total: 1,
            percentage: 100,
            filename,
          });
          return { success: true, filename } satisfies SingleDownloadResult;
        },
        (error: unknown) => createErrorDownloadResult(error)
      ),
      abortSignal,
      createAbortResult
    );
  }

  reportProgress(options.onProgress, {
    phase: 'preparing',
    current: 0,
    total: 1,
    percentage: 0,
    filename,
  });

  try {
    await adapter.download(url, filename);
    reportProgress(options.onProgress, {
      phase: 'complete',
      current: 1,
      total: 1,
      percentage: 100,
      filename,
    });
    return { success: true, filename };
  } catch (error) {
    return createErrorDownloadResult(error);
  }
}

async function downloadWithFetchFallback(
  url: string,
  filename: string,
  options: DownloadOptions,
  abortSignal: AbortSignal | undefined,
  adapter: DownloadAdapter
): Promise<SingleDownloadResult> {
  reportProgress(options.onProgress, {
    phase: 'preparing',
    current: 0,
    total: 1,
    percentage: 0,
    filename,
  });

  try {
    // Fetch in content script context (has host_permissions to bypass CORS).
    // Service Workers cannot bypass CORS for twimg.com without specific headers.
    // Apply a timeout race via AbortSignal.timeout so the fetch doesn't hang
    // indefinitely if the network stalls or the server doesn't respond.
    const timeoutSignal = AbortSignal.timeout(DEFAULT_REQUEST_TIMEOUT_MS);
    const fetchInit: RequestInit = { credentials: 'include' };

    if (abortSignal) {
      // Combine caller's abort signal with the timeout signal
      const combinedController = new AbortController();
      const onCombinedAbort = () => combinedController.abort();
      abortSignal.addEventListener('abort', onCombinedAbort, { once: true });
      timeoutSignal.addEventListener('abort', onCombinedAbort, { once: true });
      fetchInit.signal = combinedController.signal;
    } else {
      fetchInit.signal = timeoutSignal;
    }

    const response = await fetch(url, fetchInit);
    if (!response.ok) {
      return createErrorDownloadResult(
        new Error(`HTTP ${response.status}: ${response.statusText}`)
      );
    }
    const blob = await response.blob();

    reportProgress(options.onProgress, {
      phase: 'downloading',
      current: 50,
      total: 100,
      percentage: 50,
      filename,
    });

    // Pass blob to adapter (which creates object URL and relays to background SW)
    const downloadBlobPromise = adapter.downloadBlob(blob, filename);

    // R6: Race adapter.downloadBlob against abort signal so cancellation
    // propagates when the user cancels after the fetch phase completes.
    if (abortSignal) {
      const result = await raceWithAbort(
        downloadBlobPromise.then(
          () => ({ success: true, filename }) satisfies SingleDownloadResult,
          (error: unknown) => createErrorDownloadResult(error)
        ),
        abortSignal,
        createAbortResult
      );

      if (!result.success) return result;
    } else {
      await downloadBlobPromise;
    }

    reportProgress(options.onProgress, {
      phase: 'complete',
      current: 1,
      total: 1,
      percentage: 100,
      filename,
    });
    return { success: true, filename };
  } catch (error) {
    return createErrorDownloadResult(error);
  }
}

async function downloadBlobWithAdapter(
  blob: Blob,
  filename: string,
  abortSignal: AbortSignal | undefined
): Promise<SingleDownloadResult> {
  const adapter = getDownloadAdapter();

  if (abortSignal?.aborted) return createAbortResult();

  try {
    await adapter.downloadBlob(blob, filename);
    return { success: true, filename };
  } catch (error) {
    return createErrorDownloadResult(error);
  }
}
