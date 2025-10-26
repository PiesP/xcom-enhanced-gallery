/**
 * @fileoverview Settings schema hashing utilities
 * @description Compute a stable hash of the AppSettings shape to detect schema drift.
 */

import { DEFAULT_SETTINGS as defaultSettings } from '@/constants';

/**
 * 간단한 해시 함수 (JSON 문자열 기반)
 */
function computeHash(input: unknown): string {
  const str = JSON.stringify(input);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32-bit 정수로 변환
  }
  return Math.abs(hash).toString(16);
}

/**
 * Compute hash from arbitrary object shape
 */
export function computeSettingsSchemaHashFrom(obj: unknown): string {
  // __schemaHash 제외하고 해시 계산
  const filtered = obj && typeof obj === 'object' ? obj : {};
  const str = JSON.stringify(filtered, (key, value) =>
    key === '__schemaHash' ? undefined : value
  );
  return computeHash(str);
}

/**
 * Compute hash of the current DEFAULT_SETTINGS schema
 */
export function computeCurrentSettingsSchemaHash(): string {
  return computeSettingsSchemaHashFrom(defaultSettings);
}

export const __private = { computeHash };
