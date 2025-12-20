/**
 * @fileoverview Download planning utilities (functional core)
 * @description Pure functions that convert inputs (media, options, capabilities)
 *              into executable download plans.
 */

import { generateMediaFilename, generateZipFilename } from '@shared/core/filename';
import type { MediaInfo } from '@shared/types/media.types';

export type DownloadMethod = 'gm_download' | 'none';

export interface SingleDownloadPlanningInput {
  method: DownloadMethod;
  mediaUrl: string;
  filename: string;
  hasProvidedBlob: boolean;
}

export type SingleDownloadPlan =
  | {
      strategy: 'gm_download';
      url: string;
      filename: string;
      useBlobUrl: boolean;
    }
  | {
      strategy: 'none';
      filename: string;
      error: string;
    };

/**
 * Plan the download strategy for a single item.
 *
 * Notes:
 * - This function is pure by design and performs no IO.
 * - URL.createObjectURL is an effect and must be done by the caller.
 */
export function planSingleDownload(input: SingleDownloadPlanningInput): SingleDownloadPlan {
  const { method, mediaUrl, filename, hasProvidedBlob } = input;

  if (method === 'gm_download') {
    return {
      strategy: 'gm_download',
      url: mediaUrl,
      filename,
      useBlobUrl: hasProvidedBlob,
    };
  }

  return { strategy: 'none', filename, error: 'No download method' };
}

export interface PlannedZipItem {
  url: string;
  desiredName: string;
  blob?: Blob | Promise<Blob> | undefined;
}

export interface BulkDownloadPlanningInput {
  mediaItems: readonly MediaInfo[];
  prefetchedBlobs?: Map<string, Blob | Promise<Blob>> | undefined;
  zipFilename?: string | undefined;
  /**
   * Injected time source for filename fallbacks (keeps planning pure).
   */
  nowMs?: number;
}

export interface BulkDownloadPlan {
  items: PlannedZipItem[];
  zipFilename: string;
}

/**
 * Plan the ZIP download: resolve desired names and associate optional prefetched blobs.
 */
export function planBulkDownload(input: BulkDownloadPlanningInput): BulkDownloadPlan {
  const items: PlannedZipItem[] = input.mediaItems.map((media) => ({
    url: media.url,
    desiredName:
      input.nowMs === undefined
        ? generateMediaFilename(media)
        : generateMediaFilename(media, { nowMs: input.nowMs }),
    blob: input.prefetchedBlobs?.get(media.url),
  }));

  const zipFilename =
    input.zipFilename ||
    (input.nowMs === undefined
      ? generateZipFilename(input.mediaItems)
      : generateZipFilename(input.mediaItems, { nowMs: input.nowMs }));

  return { items, zipFilename };
}

export type ZipSaveStrategy = 'gm_download' | 'none';

/**
 * Plan how to persist a prepared ZIP blob.
 */
export function planZipSave(method: DownloadMethod): ZipSaveStrategy {
  if (method === 'gm_download') return 'gm_download';
  return 'none';
}
