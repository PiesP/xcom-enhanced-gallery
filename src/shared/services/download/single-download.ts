// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { DOWNLOAD_TIMEOUT_MS } from '@constants/performance';
import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { resolveGMDownload } from '@shared/external/userscript/adapter';
import type { DownloadProvider } from '@shared/services/download/download-provider.contract';
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
  return {
    hasGMDownload,
    method: hasGMDownload ? 'gm_download' : 'none',
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
  const gmDownload = cap.gmDownload;
  if (!gmDownload) {
    return { success: false, error: 'No download method available' };
  }

  reportProgress(options.onProgress, {
    phase: 'preparing',
    current: 0,
    total: 1,
    percentage: 0,
    filename,
  });

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
        // NOTE: GM_download onload fires when the browser download dialog appears,
        // NOT when the file is actually saved. User cancellation after this point
        // cannot be detected (Tampermonkey/Violentmonkey API limitation).
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

export class GMDownloadProvider implements DownloadProvider {
  readonly name = 'GM_download';

  private gmDownload: GMDownloadFunction | null | undefined = undefined;

  detect(): boolean {
    if (this.gmDownload !== undefined) return this.gmDownload !== null;
    try {
      const resolved = asGMDownloadFunction(resolveGMDownload());
      this.gmDownload = resolved ?? null;
      return resolved !== null;
    } catch {
      this.gmDownload = null;
      return false;
    }
  }

  async download(url: string, filename: string): Promise<SingleDownloadResult> {
    const gmDownload = this.gmDownload;
    if (!gmDownload) {
      return { success: false, error: 'No download method available' };
    }

    if (typeof url !== 'string' || !url.startsWith('http')) {
      return { success: false, error: `Invalid URL for download: ${url}` };
    }

    return new Promise<SingleDownloadResult>((resolve) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      let settled = false;

      const cleanup = (): void => {
        if (timer) clearTimeout(timer);
      };

      const settle = (result: SingleDownloadResult): void => {
        if (settled) return;
        settled = true;
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
          // NOTE: GM_download onload fires when the browser download dialog appears,
          // NOT when the file is actually saved. User cancellation after this point
          // cannot be detected (Tampermonkey/Violentmonkey API limitation).
          onload: () => settle({ success: true, filename }),
          onerror: (error: unknown) => {
            settle({ success: false, error: normalizeErrorMessage(error) });
          },
          ontimeout: () => settle({ success: false, error: DOWNLOAD_TIMEOUT_MESSAGE }),
        });
      } catch (error) {
        settle({ success: false, error: normalizeErrorMessage(error) });
      }
    });
  }
}
