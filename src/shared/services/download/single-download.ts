import { getErrorMessage } from '@shared/error/utils';
import { logger } from '@shared/logging';
import { generateMediaFilename } from '@shared/services/filename-service';
import type { MediaInfo } from '@shared/types/media.types';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import type { DownloadOptions, SingleDownloadResult } from './types';

export type GMDownloadFunction = (options: Record<string, unknown>) => void;

type GlobalWithGMDownload = typeof globalThis & {
  ['GM_download']?: GMDownloadFunction;
};

export function getGMDownload(): GMDownloadFunction | undefined {
  const gm = globalThis as GlobalWithGMDownload;
  const download =
    typeof GM_download !== 'undefined'
      ? (GM_download as unknown as GMDownloadFunction)
      : gm['GM_download'];
  return typeof download === 'function' ? download : undefined;
}

export async function downloadSingleFile(
  media: MediaInfo,
  options: DownloadOptions = {},
): Promise<SingleDownloadResult> {
  if (options.signal?.aborted) {
    return { success: false, error: 'User cancelled download' };
  }

  const gmDownload = getGMDownload();
  if (!gmDownload) {
    return {
      success: false,
      error: 'Must be run in Tampermonkey environment',
    };
  }

  const filename = generateMediaFilename(media);

  // Use blob URL if available, otherwise media URL
  let url = media.url;
  let isBlobUrl = false;

  if (options.blob) {
    url = URL.createObjectURL(options.blob);
    isBlobUrl = true;
  }

  return new Promise((resolve) => {
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
      });
      cleanup();
      resolve({ success: false, error: 'Download timeout' });
    }, 30000);

    try {
      gmDownload({
        url,
        name: filename,
        onload: () => {
          logger.debug(`[SingleDownload] Download complete: ${filename}`);
          options.onProgress?.({
            phase: 'complete',
            current: 1,
            total: 1,
            percentage: 100,
          });
          cleanup();
          resolve({ success: true, filename });
        },
        onerror: (error: unknown) => {
          const errorMsg = getErrorMessage(error);
          logger.error(`[SingleDownload] Download failed:`, error);
          options.onProgress?.({
            phase: 'complete',
            current: 1,
            total: 1,
            percentage: 0,
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
