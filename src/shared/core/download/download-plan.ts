/**
 * @fileoverview Download planning utilities (functional core)
 * @description Pure functions that convert inputs (media, options, capabilities)
 *              into executable download plans.
 */

import { generateMediaFilename, generateZipFilename } from '@shared/core/filename/filename-utils';
import type { MediaInfo } from '@shared/types/media.types';

type DownloadMethod = 'gm_download' | 'none';
type ZipSaveStrategy = 'gm_download' | 'none';

interface SingleDownloadPlanningInput {
  readonly method: DownloadMethod;
  readonly mediaUrl: string;
  readonly filename: string;
  readonly hasProvidedBlob: boolean;
}

export type SingleDownloadPlan =
  | {
      readonly strategy: 'gm_download';
      readonly url: string;
      readonly filename: string;
      readonly useBlobUrl: boolean;
    }
  | {
      readonly strategy: 'none';
      readonly filename: string;
      readonly error: string;
    };

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

/**
 * Plan the download strategy for a single item.
 * @param input - Configuration for single download planning
 * @returns Download plan with strategy and metadata
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
export function planZipSave(method: DownloadMethod): ZipSaveStrategy {
  return method === 'gm_download' ? 'gm_download' : 'none';
}
