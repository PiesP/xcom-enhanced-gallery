import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { getUserCancelledAbortErrorFromSignal } from '@shared/error/cancellation';
import { getErrorMessage } from '@shared/error/normalize';
import { logger } from '@shared/logging/logger';
import {
  type DownloadCapability,
  detectDownloadCapability,
} from '@shared/services/download/fallback-download';
import type { DownloadOptions, SingleDownloadResult } from '@shared/services/download/types';
import type { MediaInfo } from '@shared/types/media.types';
import { globalTimerManager } from '@shared/utils/time/timer-management';

const DOWNLOAD_TIMEOUT_MS = 30_000;
const DOWNLOAD_TIMEOUT_MESSAGE = 'Download timeout';

type ProgressCallback = DownloadOptions['onProgress'];

const reportProgress = (
  onProgress: ProgressCallback | undefined,
  phase: 'preparing' | 'downloading' | 'complete',
  percentage: number,
  filename: string,
): void => {
  if (!onProgress) return;
  onProgress({ phase, current: 1, total: 1, percentage, filename });
};

const createAbortResult = (signal?: AbortSignal): SingleDownloadResult => ({
  success: false,
  error: getErrorMessage(
    getUserCancelledAbortErrorFromSignal(signal ?? new AbortController().signal),
  ) || 'Download cancelled by user',
});

export async function downloadSingleFile(
  media: MediaInfo,
  options: DownloadOptions = {},
  capability?: DownloadCapability,
): Promise<SingleDownloadResult> {
  const abortSignal = options.signal;
  if (abortSignal?.aborted) return createAbortResult(abortSignal);

  const filename = generateMediaFilename(media, { nowMs: Date.now() });
  const cap = capability ?? detectDownloadCapability();
  if (!cap.gmDownload) {
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
      cap.gmDownload({
        url,
        name: filename,
        onload: () => settle({ success: true, filename }),
        onerror: (error: unknown) => {
          settle({ success: false, error: getErrorMessage(error) });
        },
        ontimeout: () => settle({ success: false, error: DOWNLOAD_TIMEOUT_MESSAGE }),
        onprogress: (progress) => {
          if (settled || !options.onProgress || progress.total <= 0) return;
          const pct = Math.min(100, Math.max(0, Math.round((progress.loaded / progress.total) * 100)));
          reportProgress(options.onProgress, 'downloading', pct, filename);
        },
      });
    } catch (error) {
      settle({ success: false, error: getErrorMessage(error) });
    }
  });
}
