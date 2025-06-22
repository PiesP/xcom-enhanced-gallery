/**
 * @fileoverview 미디어 중복 제거 유틸리티
 * @version 2.0.0 - 간소화 및 단일 책임 원칙 적용
 *
 * Clean Architecture 원칙에 따라 단순하고 일관성 있는 중복 제거 로직 제공
 */

import type { MediaInfo } from '@core/types/media.types';
import { logger } from '@infrastructure/logging/logger';

/**
 * 미디어 아이템 중복 제거
 *
 * URL을 기준으로 중복을 판단하며, 첫 번째 발견된 아이템을 유지합니다.
 *
 * @param mediaItems 중복 제거할 미디어 아이템 배열
 * @returns 중복이 제거된 미디어 아이템 배열
 *
 * @example
 * ```typescript
 * const items = [
 *   { url: 'image1.jpg', id: '1', type: 'image' },
 *   { url: 'image1.jpg', id: '2', type: 'image' }, // 중복 제거됨
 *   { url: 'image2.jpg', id: '3', type: 'image' }
 * ];
 * const unique = removeDuplicateMediaItems(items); // 2개 아이템 반환
 * ```
 */
export function removeDuplicateMediaItems(mediaItems: readonly MediaInfo[]): MediaInfo[] {
  if (!mediaItems?.length) {
    return [];
  }

  const seen = new Set<string>();
  const uniqueItems: MediaInfo[] = [];

  for (const item of mediaItems) {
    // URL이 없는 아이템은 건너뛰기
    if (!item?.url) {
      logger.warn('[deduplication] Skipping item without URL');
      continue;
    }

    // 이미 존재하지 않는 URL만 추가
    if (!seen.has(item.url)) {
      seen.add(item.url);
      uniqueItems.push(item);
    }
  }

  // 로깅 (성능 최적화를 위해 실제로 제거된 경우만)
  const removedCount = mediaItems.length - uniqueItems.length;
  if (removedCount > 0) {
    logger.debug('[deduplication] Removed duplicates:', {
      original: mediaItems.length,
      unique: uniqueItems.length,
      removed: removedCount,
    });
  }

  return uniqueItems;
}
