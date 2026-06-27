// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { DOWNLOAD_TIMEOUT_MS } from '@constants/performance';
import { getDownloadAdapter } from '@platform/index';
import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { resolveGMDownload } from '@shared/external/userscript/adapter';
import type {
  DownloadCapability,
  DownloadOptions,
  GMDownloadFunction,
  SingleDownloadResult,
} from '@shared/services/download/types';
import { reportProgress } from '@shared/services/download/types';
import type { MediaInfo } from '@shared/types/media.types';

function asGMDownloadFunction(value: unknown): GMDownloadFunction | undefined {
  return typeof value === 'function' ? (value as GMDownloadFunction) : undefined;
}

export function detectDownloadCapability(): DownloadCapability {
  const gmDownload = asGMDownloadFunction(resolveGMDownload());
  const hasGMDownload = !!gmDownload;
  const hasChromeDownloads =
    typeof chrome !== 'undefined' &&
    typeof chrome.downloads !== 'undefined' &&
    typeof chrome.downloads.download === 'function';

  let method: DownloadCapability['method'] = 'none';
  if (hasGMDownload) {
    method = 'gm_download';
  } else if (hasChromeDownloads) {
    method = 'chrome_downloads';
  }

  return {
    hasGMDownload,
    hasChromeDownloads,
    method,
    gmDownload: hasGMDownload ? gmDownload : undefined,
  };
}

const DOWNLOAD_TIMEOUT_MESSAGE =
  'Download timed out after 30s. The file may still be saving — check your browser downloads.';

const createAbortResult = (): SingleDownloadResult => ({
  success: false,
  error: 'Download cancelled by user',
});

export async function downloadSingleFile(
  media: MediaInfo,
  options: DownloadOptions = {},
  capability?: DownloadCapability
): Promise<SingleDownloadResult> {
  const abortSignal = options.signal;
  if (abortSignal?.aborted) return createAbortResult();

  const filename = generateMediaFilename(media, { nowMs: Date.now() });
  const cap = capability ?? detectDownloadCapability();

  // For MV3 or GM download, use GM_download if available
  if (cap.method === 'gm_download' && cap.gmDownload) {
    return downloadWithGM(cap.gmDownload, media, options, abortSignal, filename);
  }

  // For MV3 chrome.downloads, delegate to the download adapter
  if (cap.method === 'chrome_downloads') {
    return downloadWithChrome(media, options, abortSignal, filename);
  }

  return { success: false, error: 'No download method available' };
}

async function downloadWithGM(
  gmDownload: GMDownloadFunction,
  media: MediaInfo,
  options: DownloadOptions,
  _abortSignal: AbortSignal | undefined,
  filename: string
): Promise<SingleDownloadResult> {
  let url = media.url;
  let isBlobUrl = false;
  const blob = options.blob;
  if (blob) {
    url = URL.createObjectURL(blob);
    isBlobUrl = true;
  }

  return new Promise<SingleDownloadResult>((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const cleanup = (): void => {
      if (isBlobUrl) URL.revokeObjectURL(url);
      if (timer) clearTimeout(timer);
    };

    const settle = (result: SingleDownloadResult): void => {
      if (settled) return;
      settled = true;
      if (result.success) {
        reportProgress(options.onProgress, {
          phase: 'complete',
          current: 1,
          total: 1,
          percentage: 100,
          filename,
        });
      }
      cleanup();
      resolve(result);
    };

    timer = setTimeout(() => {
      settle({ success: false, error: DOWNLOAD_TIMEOUT_MESSAGE });
    }, DOWNLOAD_TIMEOUT_MS);

    try {
      gmDownload({
        url,
        name: filename,
        onload: () => settle({ success: true, filename }),
        onerror: (error: unknown) => {
          settle({ success: false, error: normalizeErrorMessage(error) });
        },
        ontimeout: () => settle({ success: false, error: DOWNLOAD_TIMEOUT_MESSAGE }),
        onprogress: (progress) => {
          if (settled || !options.onProgress || progress.total <= 0) return;
          const pct = Math.min(
            100,
            Math.max(0, Math.round((progress.loaded / progress.total) * 100))
          );
          reportProgress(options.onProgress, {
            phase: 'downloading',
            current: progress.loaded,
            total: progress.total,
            percentage: pct,
            filename,
          });
        },
      });
    } catch (error) {
      settle({ success: false, error: normalizeErrorMessage(error) });
    }
  });
}

async function downloadWithChrome(
  media: MediaInfo,
  options: DownloadOptions,
  _abortSignal: AbortSignal | undefined,
  filename: string
): Promise<SingleDownloadResult> {
  // For MV3, we use the download adapter which relays to background SW
  const adapter = getDownloadAdapter();

  reportProgress(options.onProgress, {
    phase: 'preparing',
    current: 0,
    total: 1,
    percentage: 0,
    filename,
  });

  try {
    let url = media.url;
    if (options.blob) {
      // For blob downloads, use the adapter's downloadBlob
      await adapter.downloadBlob(options.blob, filename);
    } else {
      url = media.url;
      await adapter.download(url, filename);
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
    return { success: false, error: normalizeErrorMessage(error) };
  }
}
