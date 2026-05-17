import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { normalizeErrorMessage } from '@shared/error/normalize';
import { isGMAPIAvailable, resolveGMDownload } from '@shared/external/userscript/adapter';
import type {
  DownloadCapability,
  DownloadOptions,
  GMDownloadFunction,
  SingleDownloadResult,
} from '@shared/services/download/types';
import type { MediaInfo } from '@shared/types/media.types';
import { reportProgress } from '@shared/utils/download/report-progress';

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

const DOWNLOAD_TIMEOUT_MS = 30_000;
const DOWNLOAD_TIMEOUT_MESSAGE = 'Download timeout';

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

  const filename = generateMediaFilename(media, { nowMs: performance.now() });
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
