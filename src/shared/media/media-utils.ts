/**
 * @fileoverview Shared media utility functions for dimension extraction, URL normalization, and sorting.
 */

import { logger } from '@shared/logging';
import type { TweetMediaEntry } from '@shared/services/media/types';
import type { MediaInfo } from '@shared/types/media.types';
import { clampIndex } from '@shared/utils/types/safety';

export interface DimensionPair {
  readonly width: number;
  readonly height: number;
}

const STANDARD_GALLERY_HEIGHT = 720;

const DEFAULT_DIMENSIONS: DimensionPair = {
  width: 540,
  height: STANDARD_GALLERY_HEIGHT,
} as const;

/**
 * Generic deduplication function
 * @template T - Array element type
 * @param items - Array to deduplicate (readonly, null/undefined safe)
 * @param keyExtractor - Function to extract unique key from each item
 * @returns Deduplicated array (original order preserved)
 */
function removeDuplicates<T>(items: readonly T[], keyExtractor: (item: T) => string): T[] {
  const seen = new Set<string>();
  const uniqueItems: T[] = [];

  for (const item of items) {
    if (!item) {
      continue;
    }

    const key = keyExtractor(item);
    if (!key) {
      logger.warn('Skipping item without key');
      continue;
    }

    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }

  return uniqueItems;
}

/**
 * Deduplicate media items based on URL
 * @param mediaItems - Array of media items to deduplicate
 * @returns Deduplicated array of media items
 */
export function removeDuplicateMediaItems(mediaItems: readonly MediaInfo[]): MediaInfo[] {
  if (!mediaItems?.length) {
    return [];
  }

  const result = removeDuplicates(mediaItems, (item) => item.originalUrl ?? item.url);

  if (__DEV__) {
    const removedCount = mediaItems.length - result.length;
    if (removedCount > 0) {
      logger.debug('Removed duplicate media items:', {
        original: mediaItems.length,
        unique: result.length,
        removed: removedCount,
      });
    }
  }

  return result;
}

/**
 * Extract visual index from expanded_url
 * Parses Twitter URL to find visual position in media grid.
 */
export function extractVisualIndexFromUrl(url: string): number {
  if (!url) return 0;
  const match = url.match(/\/(photo|video)\/(\d+)$/);
  const visualNumber = match?.[2] ? Number.parseInt(match[2], 10) : NaN;
  return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
}

/**
 * Sort media by visual display order
 */
export function sortMediaByVisualOrder(mediaItems: TweetMediaEntry[]): TweetMediaEntry[] {
  if (mediaItems.length <= 1) return mediaItems;

  const withVisualIndex = mediaItems.map((media) => {
    const visualIndex = extractVisualIndexFromUrl(media.expanded_url || '');
    return { media, visualIndex };
  });

  withVisualIndex.sort((a, b) => a.visualIndex - b.visualIndex);

  return withVisualIndex.map(({ media }, newIndex) => ({
    ...media,
    index: newIndex,
  }));
}

/**
 * Extract Dimensions from URL - Parse WxH Pattern
 */
export function extractDimensionsFromUrl(url: string): { width: number; height: number } | null {
  if (!url) return null;
  // Match patterns like /640x480/ or /640x480.jpg or /640x480 at end of path
  const match = url.match(/\/(\d{2,6})x(\d{2,6})(?:\/|\.|$)/);
  if (!match) return null;

  const width = Number.parseInt(match[1] ?? '', 10);
  const height = Number.parseInt(match[2] ?? '', 10);

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  return { width, height };
}

/**
 * Normalize Dimension - Type-Safe Number Parsing
 */
export function normalizeDimension(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }
  return null;
}

/**
 * Normalize Media URL for Comparison
 * Extracts pure filename (removes query strings, fragments)
 */
export function normalizeMediaUrl(url: string): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    let filename = pathname.split('/').pop();

    if (filename) {
      const dotIndex = filename.lastIndexOf('.');
      if (dotIndex !== -1) {
        filename = filename.substring(0, dotIndex);
      }
    }

    return filename && filename.length > 0 ? filename : null;
  } catch {
    try {
      const lastSlash = url.lastIndexOf('/');
      if (lastSlash === -1) return null;
      let filenamePart = url.substring(lastSlash + 1);
      const queryIndex = filenamePart.indexOf('?');
      if (queryIndex !== -1) {
        filenamePart = filenamePart.substring(0, queryIndex);
      }
      const hashIndex = filenamePart.indexOf('#');
      if (hashIndex !== -1) filenamePart = filenamePart.substring(0, hashIndex);

      const dotIndex = filenamePart.lastIndexOf('.');
      if (dotIndex !== -1) {
        filenamePart = filenamePart.substring(0, dotIndex);
      }

      return filenamePart.length > 0 ? filenamePart : null;
    } catch {
      return null;
    }
  }
}

type MetadataRecord = Record<string, unknown> | undefined;

function scaleAspectRatio(widthRatio: number, heightRatio: number): DimensionPair {
  if (heightRatio <= 0 || widthRatio <= 0) {
    return DEFAULT_DIMENSIONS;
  }

  const scaledHeight = STANDARD_GALLERY_HEIGHT;
  const scaledWidth = Math.max(1, Math.round((widthRatio / heightRatio) * scaledHeight));

  return {
    width: scaledWidth,
    height: scaledHeight,
  };
}

function extractDimensionsFromMetadataObject(
  dimensions?: Record<string, unknown>
): DimensionPair | null {
  if (!dimensions) {
    return null;
  }

  const width = normalizeDimension(dimensions.width);
  const height = normalizeDimension(dimensions.height);
  if (width && height) {
    return { width, height };
  }

  return null;
}

function extractDimensionsFromUrlCandidate(candidate: unknown): DimensionPair | null {
  if (typeof candidate !== 'string' || !candidate) {
    return null;
  }
  return extractDimensionsFromUrl(candidate);
}

function deriveDimensionsFromMetadata(metadata: MetadataRecord): DimensionPair | null {
  if (!metadata) {
    return null;
  }

  const dimensions = extractDimensionsFromMetadataObject(
    metadata.dimensions as Record<string, unknown> | undefined
  );
  if (dimensions) {
    return dimensions;
  }

  const apiData = metadata.apiData as Record<string, unknown> | undefined;
  if (!apiData) {
    return null;
  }

  const originalWidth = normalizeDimension(apiData.original_width ?? apiData.originalWidth);
  const originalHeight = normalizeDimension(apiData.original_height ?? apiData.originalHeight);
  if (originalWidth && originalHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const fromDownloadUrl = extractDimensionsFromUrlCandidate(apiData.download_url);
  if (fromDownloadUrl) {
    return fromDownloadUrl;
  }

  const fromPreviewUrl = extractDimensionsFromUrlCandidate(apiData.preview_url);
  if (fromPreviewUrl) {
    return fromPreviewUrl;
  }

  const aspectRatio = apiData.aspect_ratio;
  if (Array.isArray(aspectRatio) && aspectRatio.length >= 2) {
    const ratioWidth = normalizeDimension(aspectRatio[0]);
    const ratioHeight = normalizeDimension(aspectRatio[1]);
    if (ratioWidth && ratioHeight) {
      return scaleAspectRatio(ratioWidth, ratioHeight);
    }
  }

  return null;
}

function deriveDimensionsFromMediaUrls(media: MediaInfo): DimensionPair | null {
  const candidates: Array<string | undefined> = [media.url, media.originalUrl, media.thumbnailUrl];
  for (const candidate of candidates) {
    const dimensions = extractDimensionsFromUrlCandidate(candidate);
    if (dimensions) {
      return dimensions;
    }
  }
  return null;
}

export function resolveMediaDimensions(media: MediaInfo | undefined): DimensionPair {
  if (!media) {
    return DEFAULT_DIMENSIONS;
  }

  const directWidth = normalizeDimension(media.width);
  const directHeight = normalizeDimension(media.height);
  if (directWidth && directHeight) {
    return { width: directWidth, height: directHeight };
  }

  const fromMetadata = deriveDimensionsFromMetadata(
    media.metadata as Record<string, unknown> | undefined
  );
  if (fromMetadata) {
    return fromMetadata;
  }

  const fromUrls = deriveDimensionsFromMediaUrls(media);
  if (fromUrls) {
    return fromUrls;
  }

  return DEFAULT_DIMENSIONS;
}

function toRem(pixels: number): string {
  return `${(pixels / 16).toFixed(4)}rem`;
}

export function createIntrinsicSizingStyle(dimensions: DimensionPair): Record<string, string> {
  const ratio = dimensions.height > 0 ? dimensions.width / dimensions.height : 1;
  return {
    '--xeg-aspect-default': `${dimensions.width} / ${dimensions.height}`,
    '--xeg-gallery-item-intrinsic-width': toRem(dimensions.width),
    '--xeg-gallery-item-intrinsic-height': toRem(dimensions.height),
    '--xeg-gallery-item-intrinsic-ratio': ratio.toFixed(6),
  };
}

/**
 * Adjust clicked index after deduplication
 *
 * Finds the new index of the clicked item in the deduplicated list.
 *
 * @param originalItems - The original list of media items
 * @param uniqueItems - The deduplicated list of media items
 * @param originalClickedIndex - The index of the clicked item in the original list
 * @returns The index of the clicked item in the uniqueItems list, or 0 if not found
 */
export function adjustClickedIndexAfterDeduplication(
  originalItems: MediaInfo[],
  uniqueItems: MediaInfo[],
  originalClickedIndex: number
): number {
  if (uniqueItems.length === 0) return 0;

  // Normalize original index using shared clamp utility
  const safeOriginalIndex = clampIndex(originalClickedIndex, originalItems.length);
  const clickedItem = originalItems[safeOriginalIndex];

  if (!clickedItem) return 0;

  const clickedKey = clickedItem.originalUrl ?? clickedItem.url;
  const newIndex = uniqueItems.findIndex((item) => {
    const itemKey = item.originalUrl ?? item.url;
    return itemKey === clickedKey;
  });

  return newIndex >= 0 ? newIndex : 0;
}
