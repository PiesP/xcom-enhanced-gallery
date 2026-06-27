// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { getDownloadAdapter } from '@platform/index';
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

  // Set up abort listener to race against the adapter download
  if (abortSignal) {
    if (abortSignal.aborted) return createAbortResult();
    const abortPromise = new Promise<SingleDownloadResult>((resolve) => {
      abortSignal.addEventListener(
        'abort',
        () => {
          resolve(createAbortResult());
        },
        { once: true }
      );
    });
    const resultPromise = adapter.download(url, filename).then(
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
      (error: unknown) => ({ success: false, error: normalizeErrorMessage(error) })
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
    return { success: false, error: normalizeErrorMessage(error) };
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
    return { success: false, error: normalizeErrorMessage(error) };
  }
}
