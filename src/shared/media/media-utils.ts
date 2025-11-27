/**
 * @fileoverview Shared media utility functions for dimension extraction, URL normalization, and sorting.
 */

import { logger } from '@shared/logging';
import type { TweetMediaEntry } from '@shared/services/media/types';
import type { MediaInfo } from '@shared/types/media.types';

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

  const result = removeDuplicates(mediaItems, item => item.originalUrl ?? item.url);

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
  const visualNumber = match ? Number.parseInt(match[2], 10) : NaN;
  return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
}

/**
 * Sort media by visual display order
 */
export function sortMediaByVisualOrder(mediaItems: TweetMediaEntry[]): TweetMediaEntry[] {
  if (mediaItems.length <= 1) return mediaItems;

  const withVisualIndex = mediaItems.map(media => {
    const visualIndex = extractVisualIndexFromUrl(media.expanded_url);
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
  const match = url.match(/\/(\d{2,6})x(\d{2,6})\//);
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
export function normalizeDimension(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }
  return undefined;
}

/**
 * Convert Value to Positive Number (Alias for normalizeDimension but returns null instead of undefined)
 */
export function toPositiveNumber(value: unknown): number | null {
  const result = normalizeDimension(value);
  return result === undefined ? null : result;
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
      if (queryIndex !== -1) filenamePart = filenamePart.substring(0, queryIndex);
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

  // Normalize original index
  const safeOriginalIndex = Math.max(0, Math.min(originalClickedIndex, originalItems.length - 1));
  const clickedItem = originalItems[safeOriginalIndex];

  if (!clickedItem) return 0;

  const clickedKey = clickedItem.originalUrl ?? clickedItem.url;
  const newIndex = uniqueItems.findIndex(item => {
    const itemKey = item.originalUrl ?? item.url;
    return itemKey === clickedKey;
  });

  return newIndex >= 0 ? newIndex : 0;
}
