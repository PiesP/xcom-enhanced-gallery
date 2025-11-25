/**
 * @fileoverview Settings schema hashing utilities
 * @description Compute stable hash of AppSettings shape to detect schema drift.
 */

import { DEFAULT_SETTINGS as defaultSettings } from '@/constants';

/**
 * Simple hash function (JSON string based)
 */
function computeHash(input: unknown): string {
  const str = JSON.stringify(input);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Compute hash from arbitrary object shape
 */
export function computeSettingsSchemaHashFrom(obj: unknown): string {
  // Exclude __schemaHash from hash computation
  const filtered = obj && typeof obj === 'object' ? obj : {};
  const str = JSON.stringify(filtered, (key, value) =>
    key === '__schemaHash' ? undefined : value,
  );
  return computeHash(str);
}

/**
 * Compute hash of current DEFAULT_SETTINGS schema
 */
export function computeCurrentSettingsSchemaHash(): string {
  return computeSettingsSchemaHashFrom(defaultSettings);
}

export const __private = { computeHash };
