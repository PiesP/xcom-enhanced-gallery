// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Download planning utilities (functional core)
 * @description Pure functions that convert inputs (media, options, capabilities)
 *              into executable download plans.
 */

import { generateMediaFilename, generateZipFilename } from '@shared/core/filename/filename-utils';
import type { MediaBlobProvider } from '@shared/services/download/types';
import type { MediaInfo } from '@shared/types/media.types';

export interface PlannedZipItem {
  readonly url: string;
  readonly desiredName: string;
  readonly blob?: Blob | Promise<Blob> | undefined;
  readonly getBlob?: ((signal?: AbortSignal) => Promise<Blob> | null) | undefined;
}

interface BulkDownloadPlanningInput {
  readonly mediaItems: readonly MediaInfo[];
  readonly cachedBlobs?: Map<string, Blob | Promise<Blob>> | undefined;
  readonly mediaBlobProvider?: MediaBlobProvider | undefined;
  readonly zipFilename?: string | undefined;
  readonly nowMs?: number | undefined;
}

interface BulkDownloadPlan {
  readonly items: readonly PlannedZipItem[];
  readonly zipFilename: string;
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
 * Plan the ZIP download: resolve desired names and associate optional cached blobs.
 * @param input - Configuration for bulk download planning
 * @returns Plan containing items with URLs, filenames, and optional blobs, plus ZIP filename
 */
export function planBulkDownload(input: BulkDownloadPlanningInput): BulkDownloadPlan {
  const items: PlannedZipItem[] = input.mediaItems.map((media) => ({
    url: media.url,
    desiredName: generateDesiredName(media, input.nowMs),
    blob: input.cachedBlobs?.get(media.url),
    getBlob: input.mediaBlobProvider
      ? (signal?: AbortSignal) => input.mediaBlobProvider?.(media, signal) ?? null
      : undefined,
  }));

  const zipFilename = input.zipFilename ?? generateZipName(input.mediaItems, input.nowMs);

  return { items, zipFilename };
}
