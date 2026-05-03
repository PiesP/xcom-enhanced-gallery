import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { getErrorMessage } from '@shared/error/normalize';
import type { MediaInfo } from '@shared/types/media.types';

// Inlined from types.ts
export interface DownloadOptions {
  concurrency?: number;
  retries?: number;
  signal?: AbortSignal;
  onProgress?: (progress: {
    phase: string;
    current: number;
    total: number;
    percentage: number;
    filename?: string;
  }) => void;
  zipFilename?: string;
  blob?: Blob;
  prefetchedBlobs?: Map<string, Blob | Promise<Blob>>;
}

export interface SingleDownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
}

export interface SingleDownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
}

import { resolveGMDownload } from '@shared/external/userscript/adapter';
import { isGMAPIAvailable } from '@shared/external/userscript/environment-detector';
import { globalTimerManager } from '@shared/utils/time/timer-management';

// ============================================================================
// Download capability detection (inlined from fallback-download.ts)
// ============================================================================

interface GMDownloadOptions {
  url: string;
  name: string;
  headers?: Record<string, string>;
  timeout?: number;
  saveAs?: boolean;
  onload: () => void;
  onerror: (error: unknown) => void;
  ontimeout: () => void;
  onprogress?: (progress: { loaded: number; total: number }) => void;
  [key: string]: unknown;
}

export type GMDownloadFunction = (options: GMDownloadOptions) => void;

export interface DownloadCapability {
  hasGMDownload: boolean;
  method: 'gm_download' | 'none';
  gmDownload?: GMDownloadFunction | undefined;
}

function asGMDownloadFunction(value: unknown): GMDownloadFunction | undefined {
  return typeof value === 'function' ? (value as GMDownloadFunction) : undefined;
}

export function detectDownloadCapability(): DownloadCapability {
  const gmDownload = asGMDownloadFunction(resolveGMDownload());
  const hasGMDownload = !!gmDownload && isGMAPIAvailable('download');
  return {
    hasGMDownload,
    method: hasGMDownload ? 'gm_download' : 'none',
    gmDownload: hasGMDownload ? gmDownload : undefined,
  };
}

// ============================================================================
// Single file download
// ============================================================================

const DOWNLOAD_TIMEOUT_MS = 30_000;
const DOWNLOAD_TIMEOUT_MESSAGE = 'Download timeout';

type ProgressCallback = DownloadOptions['onProgress'];

const reportProgress = (
  onProgress: ProgressCallback | undefined,
  phase: 'preparing' | 'downloading' | 'complete',
  percentage: number,
  filename: string
): void => {
  if (!onProgress) return;
  onProgress({ phase, current: 1, total: 1, percentage, filename });
};

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
  const gmDownload = cap.gmDownload;
  if (!gmDownload) {
    return { success: false, error: 'No download method available' };
  }

  reportProgress(options.onProgress, 'preparing', 0, filename);

  // Use blob URL when a pre-fetched blob is available.
  let url = media.url;
  let isBlobUrl = false;
  const blob = options.blob;
  if (blob) {
    url = URL.createObjectURL(blob);
    isBlobUrl = true;
  }

  return new Promise<SingleDownloadResult>((resolve) => {
    let timer: ReturnType<typeof globalTimerManager.setTimeout> | undefined;
    let settled = false;

    const cleanup = (): void => {
      if (isBlobUrl) URL.revokeObjectURL(url);
      if (timer) globalTimerManager.clearTimeout(timer);
    };

    const settle = (result: SingleDownloadResult): void => {
      if (settled) return;
      settled = true;
      if (result.success) {
        reportProgress(options.onProgress, 'complete', 100, filename);
      }
      cleanup();
      resolve(result);
    };

    timer = globalTimerManager.setTimeout(() => {
      settle({ success: false, error: DOWNLOAD_TIMEOUT_MESSAGE });
    }, DOWNLOAD_TIMEOUT_MS);

    try {
      gmDownload({
        url,
        name: filename,
        onload: () => settle({ success: true, filename }),
        onerror: (error: unknown) => {
          settle({ success: false, error: getErrorMessage(error) });
        },
        ontimeout: () => settle({ success: false, error: DOWNLOAD_TIMEOUT_MESSAGE }),
        onprogress: (progress) => {
          if (settled || !options.onProgress || progress.total <= 0) return;
          const pct = Math.min(
            100,
            Math.max(0, Math.round((progress.loaded / progress.total) * 100))
          );
          reportProgress(options.onProgress, 'downloading', pct, filename);
        },
      });
    } catch (error) {
      settle({ success: false, error: getErrorMessage(error) });
    }
  });
}
