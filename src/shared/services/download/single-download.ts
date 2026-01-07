import {
  createSingleDownloadCommands,
  type SingleDownloadCommand,
} from '@shared/core/download/single-download-commands';
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

const SINGLE_DOWNLOAD_TOTAL = 1;
const DOWNLOAD_TIMEOUT_MESSAGE = 'Download timeout';

type ProgressCallback = DownloadOptions['onProgress'];
type ProgressPayload = Parameters<NonNullable<ProgressCallback>>[0];

function reportSingleProgress(
  onProgress: ProgressCallback | undefined,
  payload: Omit<ProgressPayload, 'current' | 'total'> & { current?: number; total?: number }
): void {
  if (!onProgress) return;

  const current = payload.current ?? SINGLE_DOWNLOAD_TOTAL;
  const total = payload.total ?? SINGLE_DOWNLOAD_TOTAL;
  const { current: _current, total: _total, ...rest } = payload;

  onProgress({
    ...rest,
    current,
    total,
  });
}

function calculatePercentage(loaded: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((loaded / total) * 100)));
}

function createAbortResult(signal?: AbortSignal): SingleDownloadResult {
  const abortError = getUserCancelledAbortErrorFromSignal(signal);
  return {
    success: false,
    error: getErrorMessage(abortError) || 'Download cancelled by user',
  };
}

async function executeSingleDownloadCommand(
  cmd: SingleDownloadCommand,
  options: DownloadOptions,
  capability: DownloadCapability,
  blob: Blob | undefined
): Promise<SingleDownloadResult> {
  const onProgress = options.onProgress;
  const filename = cmd.filename;

  switch (cmd.type) {
    case 'FAIL':
      return { success: false, error: cmd.error };

    case 'REPORT_PROGRESS':
      reportSingleProgress(onProgress, {
        phase: cmd.phase,
        current: 0,
        percentage: cmd.percentage,
        filename,
      });
      return { success: true, filename: cmd.filename };

    case 'DOWNLOAD_WITH_GM_DOWNLOAD': {
      const gmDownload = capability.gmDownload;
      if (!gmDownload) {
        return { success: false, error: 'GM_download unavailable' };
      }

      // Use blob URL when requested.
      let url = cmd.url;
      let isBlobUrl = false;

      if (cmd.useBlobUrl) {
        if (!blob) {
          return { success: false, error: 'Blob unavailable' };
        }
        url = URL.createObjectURL(blob);
        isBlobUrl = true;
      }

      return await new Promise((resolve) => {
        let timer: ReturnType<typeof globalTimerManager.setTimeout> | undefined;

        const cleanup = () => {
          if (isBlobUrl) {
            URL.revokeObjectURL(url);
          }
          if (timer) {
            globalTimerManager.clearTimeout(timer);
            timer = undefined;
          }
        };

        let settled = false;

        const settle = (result: SingleDownloadResult, completePercentage?: number) => {
          if (settled) return;
          settled = true;

          if (completePercentage !== undefined) {
            reportSingleProgress(onProgress, {
              phase: 'complete',
              percentage: completePercentage,
              filename,
            });
          }

          cleanup();
          resolve(result);
        };

        timer = globalTimerManager.setTimeout(() => {
          settle({ success: false, error: DOWNLOAD_TIMEOUT_MESSAGE }, 0);
        }, cmd.timeoutMs);

        try {
          gmDownload({
            url,
            name: filename,
            onload: () => {
              if (__DEV__) {
                logger.debug(`[SingleDownload] Download complete: ${filename}`);
              }
              settle({ success: true, filename }, 100);
            },
            onerror: (error: unknown) => {
              const errorMsg = getErrorMessage(error);
              if (__DEV__) {
                logger.error('Download failed', error);
              }
              settle({ success: false, error: errorMsg }, 0);
            },
            ontimeout: () => {
              settle({ success: false, error: DOWNLOAD_TIMEOUT_MESSAGE }, 0);
            },
            onprogress: (progress: { loaded: number; total: number }) => {
              if (settled) return;
              if (!onProgress || progress.total <= 0) return;

              reportSingleProgress(onProgress, {
                phase: 'downloading',
                percentage: calculatePercentage(progress.loaded, progress.total),
                filename,
              });
            },
          });
        } catch (error) {
          const errorMsg = getErrorMessage(error);
          settle({ success: false, error: errorMsg });
        }
      });
    }

    default:
      return { success: false, error: 'Unknown download command' };
  }
}

export async function downloadSingleFile(
  media: MediaInfo,
  options: DownloadOptions = {},
  capability?: DownloadCapability
): Promise<SingleDownloadResult> {
  const abortSignal = options.signal;
  if (abortSignal?.aborted) {
    return createAbortResult(abortSignal);
  }

  const filename = generateMediaFilename(media, { nowMs: Date.now() });
  const effectiveCapability = capability ?? detectDownloadCapability();

  // Preserve the existing planning semantics (planSingleDownload), but execute
  // via a tiny command program to keep decision logic pure and IO local.
  const cmds = createSingleDownloadCommands({
    method: effectiveCapability.method,
    mediaUrl: media.url,
    filename,
    hasProvidedBlob: !!options.blob,
    timeoutMs: 30_000,
  });

  // Execute commands sequentially; first failing command ends the program.
  let lastOk: SingleDownloadResult = { success: true, filename };
  for (const cmd of cmds) {
    if (abortSignal?.aborted) {
      return createAbortResult(abortSignal);
    }

    const result = await executeSingleDownloadCommand(
      cmd,
      options,
      effectiveCapability,
      options.blob
    );
    if (!result.success) {
      return result;
    }
    lastOk = result;
  }

  // Return the latest successful result (action commands return their final filename).
  return lastOk;
}
