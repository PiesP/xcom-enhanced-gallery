import { planSingleDownload } from '@shared/core/download/download-plan';
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

  const plan = planSingleDownload({
    method: effectiveCapability.method,
    mediaUrl: media.url,
    filename,
    hasProvidedBlob: Boolean(options.blob),
  });

  // Use fallback method if GM_download is not available
  if (plan.strategy === 'anchor_blob' || plan.strategy === 'fetch_blob') {
    logger.debug('[SingleDownload] Using fetch+blob fallback');

    // If blob is pre-provided, use direct blob download
    if (plan.strategy === 'anchor_blob') {
      if (!options.blob) {
        return { success: false, error: 'Blob unavailable' };
      }
      return downloadBlobWithAnchor(options.blob, filename, {
        signal: options.signal,
        onProgress: options.onProgress,
      });
    }

    // Otherwise fetch and download
    return downloadWithFetchBlob(plan.url, filename, {
      signal: options.signal,
      onProgress: options.onProgress,
      timeout: 30000,
    });
  }

  if (plan.strategy === 'none') {
    return {
      success: false,
      error: plan.error,
    };
  }

  // Use GM_download (Tampermonkey/Greasemonkey with GM_download support)
  const gmDownload = effectiveCapability.gmDownload;
  if (!gmDownload) {
    // This shouldn't happen given the capability check, but handle defensively
    return {
      success: false,
      error: 'GM_download unavailable',
    };
  }

  // Use blob URL if available, otherwise media URL
  let url = plan.url;
  let isBlobUrl = false;

  if (plan.strategy === 'gm_download' && plan.useBlobUrl) {
    if (!options.blob) {
      return { success: false, error: 'Blob unavailable' };
    }
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
          logger.error('[SingleDownload] Download failed:', error);
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
