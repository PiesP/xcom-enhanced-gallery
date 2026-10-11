// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Download planning utilities (functional core)
 * @description Pure functions that convert inputs (media, options, capabilities)
 *              into executable download plans.
 */

import { generateMediaFilename, generateZipFilename } from '@shared/core/filename/filename-utils';
import type { OwnedBlob } from '@shared/services/download/live-byte-budget';
import type { MediaBlobProvider } from '@shared/services/download/types';
import type { MediaInfo } from '@shared/types/media.types';
import { getMediaDownloadUrl } from '@shared/utils/media/media-source';

export interface PlannedZipItem {
  readonly url: string;
  readonly desiredName: string;
  readonly sourceUnavailable?: boolean;
  readonly expectedSizeBytes?: number | undefined;
  readonly blob?: OwnedBlob | Promise<OwnedBlob> | undefined;
  readonly getBlob?:
    | ((signal?: AbortSignal, maxResponseBytes?: number) => Promise<OwnedBlob> | null)
    | undefined;
}

interface BulkDownloadPlanningInput {
  readonly mediaItems: readonly MediaInfo[];
  readonly cachedBlobs?: Map<string, OwnedBlob | Promise<OwnedBlob>> | undefined;
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
    url: getMediaDownloadUrl(media),
    desiredName: generateDesiredName(media, input.nowMs),
    ...(media.downloadSource?.quality === 'unverified-original' ? { sourceUnavailable: true } : {}),
    expectedSizeBytes: media.fileSize,
    blob: input.cachedBlobs?.get(getMediaDownloadUrl(media)),
    getBlob: input.mediaBlobProvider
      ? (signal?: AbortSignal, maxResponseBytes?: number) =>
          (maxResponseBytes === undefined
            ? input.mediaBlobProvider?.(media, signal)
            : input.mediaBlobProvider?.(media, signal, maxResponseBytes)) ?? null
      : undefined,
  }));

  const zipFilename = input.zipFilename ?? generateZipName(input.mediaItems, input.nowMs);

  return { items, zipFilename };
}
