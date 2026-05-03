/**
 * @fileoverview Download planning utilities (functional core)
 * @description Pure functions that convert inputs (media, options, capabilities)
 *              into executable download plans.
 */

import { generateMediaFilename, generateZipFilename } from '@shared/core/filename/filename-utils';
import type { MediaInfo } from '@shared/types/media.types';

interface PlannedZipItem {
  readonly url: string;
  readonly desiredName: string;
  readonly blob?: Blob | Promise<Blob> | undefined;
}

interface BulkDownloadPlanningInput {
  readonly mediaItems: readonly MediaInfo[];
  readonly prefetchedBlobs?: Map<string, Blob | Promise<Blob>> | undefined;
  readonly zipFilename?: string | undefined;
  readonly nowMs?: number | undefined;
}

interface BulkDownloadPlan {
  readonly items: readonly PlannedZipItem[];
  readonly zipFilename: string;
}

type ZipSaveStrategy = 'gm_download' | 'none';

/** Helper to generate filename with optional time source */
function generateDesiredName(media: MediaInfo, nowMs?: number): string {
  return nowMs === undefined
    ? generateMediaFilename(media)
    : generateMediaFilename(media, { nowMs });
}

/** Helper to generate ZIP filename with optional time source */
function generateZipName(items: readonly MediaInfo[], nowMs?: number): string {
  return nowMs === undefined ? generateZipFilename(items) : generateZipFilename(items, { nowMs });
}

/**
 * Plan the ZIP download: resolve desired names and associate optional prefetched blobs.
 * @param input - Configuration for bulk download planning
 * @returns Plan containing items with URLs, filenames, and optional blobs, plus ZIP filename
 */
export function planBulkDownload(input: BulkDownloadPlanningInput): BulkDownloadPlan {
  const items: PlannedZipItem[] = input.mediaItems.map((media) => ({
    url: media.url,
    desiredName: generateDesiredName(media, input.nowMs),
    blob: input.prefetchedBlobs?.get(media.url),
  }));

  const zipFilename = input.zipFilename ?? generateZipName(input.mediaItems, input.nowMs);

  return { items, zipFilename };
}

/**
 * Plan how to persist a prepared ZIP blob.
 * @param method - Available download method
 * @returns Strategy for saving the ZIP file
 */
export function planZipSave(method: 'gm_download' | 'none'): ZipSaveStrategy {
  return method === 'gm_download' ? 'gm_download' : 'none';
}
