// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import {
  DEFAULT_REQUEST_TIMEOUT_MS,
  SINGLE_DOWNLOAD_MAX_RESPONSE_BYTES,
} from '@constants/performance';
import { mergeAbortSignalsWithCleanup } from '@piesp/browser-core/error';
import { getDownloadAdapter } from '@platform/index';
import type { DownloadAdapter } from '@platform/types';
import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { USER_CANCELLED_MESSAGE } from '@shared/error/cancellation';
import { readResponseBody } from '@shared/network/bounded-response';
import type { DownloadOptions, SingleDownloadResult } from '@shared/services/download/types';
import { reportProgress } from '@shared/services/download/types';
import type { MediaInfo } from '@shared/types/media.types';
import { isValidMediaUrl } from '@shared/utils/url/validator';

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
export async function raceWithAbort<T>(
  work: Promise<T>,
  signal: AbortSignal,
  onAborted: () => T
): Promise<T> {
  if (signal.aborted) return onAborted();

  let abortHandler: (() => void) | null = null;

  const abortPromise = new Promise<T>((resolve) => {
    abortHandler = () => resolve(onAborted());
    signal.addEventListener('abort', abortHandler, { once: true });
  });

  try {
    return await Promise.race([work, abortPromise]);
  } finally {
    if (abortHandler) {
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

  if (!isValidMediaUrl(media.url)) {
    return createErrorDownloadResult(new Error('Invalid media download URL'));
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

  const timeoutSignal = AbortSignal.timeout(DEFAULT_REQUEST_TIMEOUT_MS);
  const responseSizeController = new AbortController();
  const fetchSignalScope = mergeAbortSignalsWithCleanup([
    ...(abortSignal ? [abortSignal] : []),
    timeoutSignal,
    responseSizeController.signal,
  ]);

  try {
    // Fetch in content script context (has host_permissions to bypass CORS).
    // Service Workers cannot bypass CORS for twimg.com without specific headers.
    // Apply a timeout race via AbortSignal.timeout so the fetch doesn't hang
    // indefinitely if the network stalls or the server doesn't respond.
    let blob: Blob;
    try {
      const response = await fetch(url, {
        credentials: 'include',
        signal: fetchSignalScope.signal,
      });
      if (!response.ok) {
        return createErrorDownloadResult(
          new Error(`HTTP ${response.status}: ${response.statusText}`)
        );
      }
      blob = (await readResponseBody(
        response,
        'blob',
        SINGLE_DOWNLOAD_MAX_RESPONSE_BYTES,
        (reason) => responseSizeController.abort(reason)
      )) as Blob;
    } finally {
      fetchSignalScope.cleanup();
    }

    reportProgress(options.onProgress, {
      phase: 'downloading',
      current: 50,
      total: 100,
      percentage: 50,
      filename,
    });

    // Preserve the existing no-signal behavior: adapter failures reach the
    // outer catch and attempt the direct URL fallback. With a caller signal,
    // failures are returned directly while cancellation wins the race.
    const downloadBlobPromise = adapter.downloadBlob(blob, filename, abortSignal).then(
      () => ({ success: true, filename }) satisfies SingleDownloadResult,
      (error: unknown) => {
        if (!abortSignal) throw error;
        return createErrorDownloadResult(error);
      }
    );
    const result = abortSignal
      ? await raceWithAbort(downloadBlobPromise, abortSignal, createAbortResult)
      : await downloadBlobPromise;

    if (!result.success) return result;

    reportProgress(options.onProgress, {
      phase: 'complete',
      current: 1,
      total: 1,
      percentage: 100,
      filename,
    });
    return result;
  } catch (error) {
    // Only the caller-owned signal represents user cancellation. The internal
    // timeout is a fetch failure and should use the direct URL fallback.
    if (abortSignal?.aborted) {
      return createAbortResult();
    }

    const fetchError = timeoutSignal.aborted
      ? new Error(`Download fetch timed out after ${DEFAULT_REQUEST_TIMEOUT_MS}ms`)
      : error;

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
        if (abortSignal?.aborted) {
          return createAbortResult();
        }
        return createErrorDownloadResult(fetchError);
      }
    }
    return createErrorDownloadResult(fetchError);
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
