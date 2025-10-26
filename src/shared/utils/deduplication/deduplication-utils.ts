/**
 * @fileoverview Deduplication Utilities
 * @description 중복 제거를 위한 유틸리티 함수들
 * @version 1.0.0
 */

import { logger } from '@shared/logging';
import type { MediaInfo } from '../../types';

/**
 * 범용 중복 제거 함수
 * @template T - 배열 요소 타입
 * @param items - 중복을 제거할 배열 (readonly, null/undefined 안전)
 * @param keyExtractor - 각 항목의 고유 키를 추출하는 함수
 * @returns 중복이 제거된 배열 (원본 순서 유지)
 * @example
 * ```typescript
 * const users = [
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' },
 *   { id: 1, name: 'Alice' } // 중복
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
 * 미디어 아이템 중복 제거 (URL 기반)
 * @param mediaItems - 중복을 제거할 미디어 배열
 * @returns 중복이 제거된 미디어 배열
 * @example
 * ```typescript
 * const unique = removeDuplicateMediaItems([
 *   { url: 'image1.jpg', ... },
 *   { url: 'image2.jpg', ... },
 *   { url: 'image1.jpg', ... } // 제거됨
 * ]);
 * ```
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
