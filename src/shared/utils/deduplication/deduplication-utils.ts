/**
 * @fileoverview Deduplication Utilities
 * @description 중복 제거를 위한 유틸리티 함수들
 */

import { logger } from '@shared/logging/logger';

/**
 * 범용 중복 제거 함수 (오버로드)
 */
/* eslint-disable no-redeclare */
export function removeDuplicates<T>(items: readonly T[]): T[];
export function removeDuplicates<T>(items: readonly T[], keyExtractor: (item: T) => string): T[];
export function removeDuplicates<T>(items: readonly T[], keyExtractor?: (item: T) => string): T[] {
  if (!items?.length) {
    return [];
  }

  // 기본 타입(string, number)의 경우 keyExtractor 없이 처리
  if (!keyExtractor) {
    // 원시 타입들은 Set으로 간단히 중복 제거
    return [...new Set(items)];
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
/* eslint-enable no-redeclare */
