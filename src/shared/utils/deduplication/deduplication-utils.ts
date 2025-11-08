/**
 * @fileoverview Deduplication Utilities
 * @description Utility functions for deduplication operations
 * @version 1.0.0
 */

import { logger } from '@shared/logging';
import type { MediaInfo } from '../../types';

/**
 * Generic deduplication function
 * @template T - Array element type
 * @param items - Array to deduplicate (readonly, null/undefined safe)
 * @param keyExtractor - Function to extract unique key from each item
 * @returns Deduplicated array (original order preserved)
 * @example
 * ```typescript
 * const users = [
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' },
 *   { id: 1, name: 'Alice' } // duplicate
 * ];
 * const unique = removeDuplicates(users, u => u.id);
 * // [{ id: 1, ... }, { id: 2, ... }]
 * ```
 */
export function removeDuplicates<T>(items: readonly T[], keyExtractor: (item: T) => string): T[] {
  if (!items?.length) {
    return [];
  }

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
 * @example
 * ```typescript
 * const unique = removeDuplicateMediaItems([
 *   { url: 'image1.jpg', ... },
 *   { url: 'image2.jpg', ... },
 *   { url: 'image1.jpg', ... } // removed
 * ]);
 * ```
 */
export function removeDuplicateMediaItems(mediaItems: readonly MediaInfo[]): MediaInfo[] {
  const result = removeDuplicates(mediaItems, item => item.originalUrl ?? item.url);

  // Log deduplication results for performance analysis
  const removedCount = mediaItems.length - result.length;
  if (removedCount > 0) {
    logger.debug('Removed duplicate media items:', {
      original: mediaItems.length,
      unique: result.length,
      removed: removedCount,
    });
  }

  return result;
}
