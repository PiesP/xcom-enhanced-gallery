// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { getDownloadAdapter } from '@platform/index';
import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { USER_CANCELLED_MESSAGE } from '@shared/error/cancellation';
import { DownloadSourceUnavailableError } from '@shared/error/download-source-unavailable-error';
import type { DownloadOptions, SingleDownloadResult } from '@shared/services/download/types';
import { reportProgress } from '@shared/services/download/types';
import { ErrorCode, type MediaInfo } from '@shared/types/media.types';
import { getMediaDownloadUrl } from '@shared/utils/media/media-source';
import { isValidMediaUrl } from '@shared/utils/url/validator';
import { DownloadResourceLimitError, downloadLiveByteBudget } from './live-byte-budget';

const createAbortResult = (): SingleDownloadResult => ({
  success: false,
  error: USER_CANCELLED_MESSAGE,
});

const createErrorDownloadResult = (error: unknown): SingleDownloadResult => ({
  success: false,
  error: normalizeErrorMessage(error),
  ...(error instanceof DownloadResourceLimitError
    ? { code: ErrorCode.RESOURCE_LIMIT }
    : error instanceof DownloadSourceUnavailableError
      ? { code: ErrorCode.SOURCE_UNAVAILABLE }
      : {}),
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
    return downloadBlobWithAdapter(options.blob, filename, abortSignal, options);
  }

  if (media.downloadSource?.quality === 'unverified-original') {
    return createErrorDownloadResult(new DownloadSourceUnavailableError());
  }

  const downloadUrl = getMediaDownloadUrl(media);
  if (!isValidMediaUrl(downloadUrl)) {
    return createErrorDownloadResult(new Error('Invalid media download URL'));
  }

  return downloadWithAdapter(downloadUrl, filename, options, abortSignal);
}

async function downloadWithAdapter(
  url: string,
  filename: string,
  options: DownloadOptions,
  abortSignal: AbortSignal | undefined
): Promise<SingleDownloadResult> {
  const adapter = getDownloadAdapter();

  reportProgress(options.onProgress, {
    phase: 'preparing',
    current: 0,
    total: 1,
    percentage: 0,
    filename,
  });

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

async function downloadBlobWithAdapter(
  blob: Blob,
  filename: string,
  abortSignal: AbortSignal | undefined,
  options: DownloadOptions
): Promise<SingleDownloadResult> {
  const adapter = getDownloadAdapter();

  if (abortSignal?.aborted) return createAbortResult();

  try {
    const owner = (options.liveBudget ?? downloadLiveByteBudget).reserve(blob.size);
    const download = adapter
      .downloadBlob(blob, filename, abortSignal, () => owner.release())
      .then(
        () => ({ success: true, filename }) satisfies SingleDownloadResult,
        (error: unknown) => createErrorDownloadResult(error)
      );
    if (!abortSignal) return await download;
    return await raceWithAbort(download, abortSignal, createAbortResult);
  } catch (error) {
    return createErrorDownloadResult(error);
  }
}
