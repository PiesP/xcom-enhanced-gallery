// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { IS_MV3 } from '@platform/detect';
import { getDownloadAdapter } from '@platform/index';
import type { DownloadAdapter } from '@platform/types';
import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import type { DownloadOptions, SingleDownloadResult } from '@shared/services/download/types';
import { reportProgress } from '@shared/services/download/types';
import type { MediaInfo } from '@shared/types/media.types';

// Removed: detectDownloadCapability (duplicated platform detection logic).
// Use getDownloadAdapter() from platform layer instead.

const createAbortResult = (): SingleDownloadResult => ({
  success: false,
  error: 'Download cancelled by user',
});

const createErrorDownloadResult = (error: unknown): SingleDownloadResult => ({
  success: false,
  error: normalizeErrorMessage(error),
});

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

  // MV3: Background SW cannot download directly from twimg.com URLs
  // (CORS/auth restrictions). Fetch in content script context (has cookies),
  // then pass blob to adapter for download.
  if (IS_MV3) {
    return downloadWithFetchFallback(url, filename, options, abortSignal, adapter);
  }

  // Set up abort listener to race against the adapter download
  if (abortSignal) {
    if (abortSignal.aborted) return createAbortResult();

    // R5: Use a short-lived AbortController to auto-cleanup the listener on
    // the original signal once the race settles. This prevents listener leaks
    // when the caller's AbortSignal outlives the download (e.g., a long-lived
    // orchestrator signal that is reused across multiple downloads).
    const cleanupController = new AbortController();
    const onAbort = (): void => {
      cleanupController.abort();
    };
    abortSignal.addEventListener('abort', onAbort, {
      once: true,
      signal: cleanupController.signal,
    });

    const abortPromise = new Promise<SingleDownloadResult>((resolve) => {
      // Listen on the cleanup controller so the promise resolves when either
      // the original abort fires OR the download completes (cleanup).
      cleanupController.signal.addEventListener(
        'abort',
        () => {
          // Only resolve with abort result if the ORIGINAL signal was aborted
          // (not our own cleanup). If we aborted ourselves, the resultPromise
          // already settled the race.
          if (abortSignal.aborted) {
            resolve(createAbortResult());
          }
        },
        { once: true }
      );
    });

    const resultPromise = adapter.download(url, filename).then(
      () => {
        // R5: Abort cleanup controller to remove listener from original signal
        cleanupController.abort();
        reportProgress(options.onProgress, {
          phase: 'complete',
          current: 1,
          total: 1,
          percentage: 100,
          filename,
        });
        return { success: true, filename } satisfies SingleDownloadResult;
      },
      (error: unknown) => {
        // R5: Also clean up on error path
        cleanupController.abort();
        return createErrorDownloadResult(error);
      }
    );

    return Promise.race([resultPromise, abortPromise]);
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
    // Fetch in content script context (has cookies/auth for twimg.com)
    const fetchInit: RequestInit = { credentials: 'include' };
    if (abortSignal) {
      (fetchInit as { signal?: AbortSignal }).signal = abortSignal;
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

    // Pass blob to adapter (which relays to background SW for download)
    await adapter.downloadBlob(blob, filename);

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
