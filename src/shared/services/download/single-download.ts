import { logger } from "@shared/logging";
import { generateMediaFilename } from "@shared/services/file-naming";
import type { MediaInfo } from "@shared/types/media.types";
import { getErrorMessage } from "@shared/utils/error-handling";
import { globalTimerManager } from "@shared/utils/timer-management";
import type { DownloadOptions, SingleDownloadResult } from "./types";

export type GMDownloadFunction = (options: Record<string, unknown>) => void;

type GlobalWithGMDownload = typeof globalThis & {
  ["GM_download"]?: GMDownloadFunction;
};

export function getGMDownload(): GMDownloadFunction | undefined {
  const gm = globalThis as GlobalWithGMDownload;
  const download =
    typeof GM_download !== "undefined"
      ? (GM_download as unknown as GMDownloadFunction)
      : gm["GM_download"];
  return typeof download === "function" ? download : undefined;
}

export async function downloadSingleFile(
  media: MediaInfo,
  options: DownloadOptions = {},
): Promise<SingleDownloadResult> {
  if (options.signal?.aborted) {
    return { success: false, error: "User cancelled download" };
  }

  const gmDownload = getGMDownload();
  if (!gmDownload) {
    return {
      success: false,
      error: "Must be run in Tampermonkey environment",
    };
  }

  const filename = generateMediaFilename(media);
  const url = media.url;

  return new Promise((resolve) => {
    const timer = globalTimerManager.setTimeout(() => {
      options.onProgress?.({
        phase: "complete",
        current: 1,
        total: 1,
        percentage: 0,
      });
      resolve({ success: false, error: "Download timeout" });
    }, 30000);

    try {
      gmDownload({
        url,
        name: filename,
        onload: () => {
          globalTimerManager.clearTimeout(timer);
          logger.debug(`[SingleDownload] Download complete: ${filename}`);
          options.onProgress?.({
            phase: "complete",
            current: 1,
            total: 1,
            percentage: 100,
          });
          resolve({ success: true, filename });
        },
        onerror: (error: unknown) => {
          globalTimerManager.clearTimeout(timer);
          const errorMsg = getErrorMessage(error);
          logger.error(`[SingleDownload] Download failed:`, error);
          options.onProgress?.({
            phase: "complete",
            current: 1,
            total: 1,
            percentage: 0,
          });
          resolve({ success: false, error: errorMsg });
        },
        ontimeout: () => {
          globalTimerManager.clearTimeout(timer);
          options.onProgress?.({
            phase: "complete",
            current: 1,
            total: 1,
            percentage: 0,
          });
          resolve({ success: false, error: "Download timeout" });
        },
        onprogress: (progress: { loaded: number; total: number }) => {
          if (options.onProgress && progress.total > 0) {
            options.onProgress({
              phase: "downloading",
              current: 1,
              total: 1,
              percentage: Math.round((progress.loaded / progress.total) * 100),
            });
          }
        },
      });
    } catch (error) {
      globalTimerManager.clearTimeout(timer);
      const errorMsg = getErrorMessage(error);
      resolve({ success: false, error: errorMsg });
    }
  });
}
