import {
  createSingleDownloadCommands,
  type SingleDownloadCommand,
} from '@shared/core/download/single-download-commands';
import { getErrorMessage } from '@shared/error/utils';
import { logger } from '@shared/logging';
import { generateMediaFilename } from '@shared/services/filename';
import type { MediaInfo } from '@shared/types/media.types';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import {
  type DownloadCapability,
  detectDownloadCapability,
  downloadBlobWithAnchor,
  downloadWithFetchBlob,
} from './fallback-download';
import type { DownloadOptions, SingleDownloadResult } from './types';

async function executeSingleDownloadCommand(
  cmd: SingleDownloadCommand,
  options: DownloadOptions,
  capability: DownloadCapability,
  blob: Blob | undefined
): Promise<SingleDownloadResult> {
  switch (cmd.type) {
    case 'FAIL':
      return { success: false, error: cmd.error };

    case 'REPORT_PROGRESS':
      options.onProgress?.({
        phase: cmd.phase,
        current: 0,
        total: 1,
        percentage: cmd.percentage,
        filename: cmd.filename,
      });
      return { success: true, filename: cmd.filename };

    case 'DOWNLOAD_BLOB_WITH_ANCHOR': {
      if (!blob) {
        return { success: false, error: 'Blob unavailable' };
      }
      return downloadBlobWithAnchor(blob, cmd.filename, {
        signal: options.signal,
        onProgress: options.onProgress,
      });
    }

    case 'DOWNLOAD_WITH_FETCH_BLOB':
      return downloadWithFetchBlob(cmd.url, cmd.filename, {
        signal: options.signal,
        onProgress: options.onProgress,
        timeout: cmd.timeoutMs,
      });

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
        const cleanup = () => {
          if (isBlobUrl) {
            URL.revokeObjectURL(url);
          }
          globalTimerManager.clearTimeout(timer);
        };

        const timer = globalTimerManager.setTimeout(() => {
          options.onProgress?.({
            phase: 'complete',
            current: 1,
            total: 1,
            percentage: 0,
            filename: cmd.filename,
          });
          cleanup();
          resolve({ success: false, error: 'Download timeout' });
        }, cmd.timeoutMs);

        try {
          gmDownload({
            url,
            name: cmd.filename,
            onload: () => {
              logger.debug(`[SingleDownload] Download complete: ${cmd.filename}`);
              options.onProgress?.({
                phase: 'complete',
                current: 1,
                total: 1,
                percentage: 100,
                filename: cmd.filename,
              });
              cleanup();
              resolve({ success: true, filename: cmd.filename });
            },
            onerror: (error: unknown) => {
              const errorMsg = getErrorMessage(error);
              logger.error('[SingleDownload] Download failed:', error);
              options.onProgress?.({
                phase: 'complete',
                current: 1,
                total: 1,
                percentage: 0,
                filename: cmd.filename,
              });
              cleanup();
              resolve({ success: false, error: errorMsg });
            },
            ontimeout: () => {
              options.onProgress?.({
                phase: 'complete',
                current: 1,
                total: 1,
                percentage: 0,
                filename: cmd.filename,
              });
              cleanup();
              resolve({ success: false, error: 'Download timeout' });
            },
            onprogress: (progress: { loaded: number; total: number }) => {
              if (options.onProgress && progress.total > 0) {
                options.onProgress({
                  phase: 'downloading',
                  current: 1,
                  total: 1,
                  percentage: Math.round((progress.loaded / progress.total) * 100),
                  filename: cmd.filename,
                });
              }
            },
          });
        } catch (error) {
          const errorMsg = getErrorMessage(error);
          cleanup();
          resolve({ success: false, error: errorMsg });
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
  if (options.signal?.aborted) {
    return { success: false, error: 'User cancelled download' };
  }

  const filename = generateMediaFilename(media);
  const effectiveCapability = capability ?? detectDownloadCapability();

  // Preserve the existing planning semantics (planSingleDownload), but execute
  // via a tiny command program to keep decision logic pure and IO local.
  const cmds = createSingleDownloadCommands({
    method: effectiveCapability.method,
    mediaUrl: media.url,
    filename,
    hasProvidedBlob: Boolean(options.blob),
    timeoutMs: 30_000,
  });

  // Execute commands sequentially; first failing command ends the program.
  let lastOk: SingleDownloadResult = { success: true, filename };
  for (const cmd of cmds) {
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
