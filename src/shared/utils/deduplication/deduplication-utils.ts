/**
 * @fileoverview Deduplication Utilities
 * @description 중복 제거를 위한 유틸리티 함수들
 */

import { logger } from '@shared/logging/logger';
import type { MediaInfo } from '@shared/types';

/**
 * 범용 중복 제거 함수
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
 * 미디어 아이템 중복 제거
 */
export function removeDuplicateMediaItems(mediaItems: readonly MediaInfo[]): MediaInfo[] {
  const result = removeDuplicates(mediaItems, item => item.url);

  // 성능 최적화를 위해 실제로 제거된 경우만 로깅
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
