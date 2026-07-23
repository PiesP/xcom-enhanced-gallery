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

import { isAbortError, USER_CANCELLED_MESSAGE } from '@shared/error/cancellation';

const createAbortResult = (): SingleDownloadResult => ({
  success: false,
  error: USER_CANCELLED_MESSAGE,
});

const createErrorDownloadResult = (error: unknown): SingleDownloadResult => ({
  success: false,
  error: normalizeErrorMessage(error),
});

/**
 * Race a work promise against an AbortSignal, returning `onAborted()` if
 * the signal fires before the work completes.
 *
 * Uses a flat `Promise.race` with `{ once: true }` listener — no nested
 * controller chain. The listener self-removes when the abort fires.
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

  let settled = false;
  let abortHandler: (() => void) | null = null;

  const abortPromise = new Promise<T>((resolve) => {
    abortHandler = () => {
      if (settled) return;
      settled = true;
      resolve(onAborted());
    };
    signal.addEventListener('abort', abortHandler, { once: true });
  });

  try {
    const result = await Promise.race([work, abortPromise]);
    settled = true;
    return result;
  } finally {
    if (!settled && abortHandler) {
      signal.removeEventListener('abort', abortHandler);
    }
  }
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
      adapter.download(url, filename, undefined, abortSignal).then(
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
    await adapter.download(url, filename, undefined, abortSignal);
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
      const cleanupCombined = () => {
        abortSignal.removeEventListener('abort', onCombinedAbort);
        timeoutSignal.removeEventListener('abort', onCombinedAbort);
      };

      try {
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
        const downloadBlobPromise = adapter.downloadBlob(blob, filename, abortSignal);

        // R6: Race adapter.downloadBlob against abort signal so cancellation
        // propagates when the user cancels after the fetch phase completes.
        const result = await raceWithAbort(
          downloadBlobPromise.then(
            () => ({ success: true, filename }) satisfies SingleDownloadResult,
            (error: unknown) => createErrorDownloadResult(error)
          ),
          abortSignal,
          createAbortResult
        );

        if (!result.success) return result;

        reportProgress(options.onProgress, {
          phase: 'complete',
          current: 1,
          total: 1,
          percentage: 100,
          filename,
        });
        return { success: true, filename };
      } finally {
        cleanupCombined();
      }
    } else {
      fetchInit.signal = timeoutSignal;

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

      await adapter.downloadBlob(blob, filename, abortSignal);

      reportProgress(options.onProgress, {
        phase: 'complete',
        current: 1,
        total: 1,
        percentage: 100,
        filename,
      });
      return { success: true, filename };
    }
  } catch (error) {
    // If the user cancelled, return abort result immediately — do NOT
    // fall through to the direct URL download fallback below.
    if (isAbortError(error)) {
      return createAbortResult();
    }

    // If fetch failed (CORS/network), fall back to direct URL download via background SW.
    // Content-script fetch with host_permissions follows CORS rules — CDN hosts
    // (pbs.twimg.com, video.twimg.com) typically serve permissive CORS headers,
    // but this fallback ensures downloads work even when they don't.
    if (adapter.needsBlobFallback()) {
      try {
        await adapter.download(url, filename, undefined, abortSignal);
        reportProgress(options.onProgress, {
          phase: 'complete',
          current: 1,
          total: 1,
          percentage: 100,
          filename,
        });
        return { success: true, filename };
      } catch {
        return createErrorDownloadResult(error);
      }
    }
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
    const download = adapter.downloadBlob(blob, filename, abortSignal).then(
      () => ({ success: true, filename }) satisfies SingleDownloadResult,
      (error: unknown) => createErrorDownloadResult(error)
    );
    if (!abortSignal) return await download;
    return await raceWithAbort(download, abortSignal, createAbortResult);
  } catch (error) {
    return createErrorDownloadResult(error);
  }
}
