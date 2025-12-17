/**
 * @fileoverview Settings schema hashing utilities
 * @description Compute stable hash of AppSettings shape to detect schema drift.
 */

import { DEFAULT_SETTINGS as defaultSettings } from '@constants';

function stableNormalizeForHash(input: unknown, seen: WeakSet<object>): unknown {
  if (input === null) return null;

  const type = typeof input;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return input;
  }

  // JSON.stringify drops functions/symbols/undefined for object properties;
  // keep behavior aligned by returning undefined for unsupported primitives.
  if (type !== 'object') {
    return undefined;
  }

  if (Array.isArray(input)) {
    return input.map((value) => stableNormalizeForHash(value, seen));
  }

  // Defensive: avoid crashes on unexpected circular references.
  const obj = input as Record<string, unknown>;
  if (seen.has(obj)) {
    return '[Circular]';
  }
  seen.add(obj);

  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    if (key === '__schemaHash') continue;
    out[key] = stableNormalizeForHash(obj[key], seen);
  }

  return out;
}

function stableStringifyForHash(input: unknown): string {
  const normalized = stableNormalizeForHash(input, new WeakSet());
  return JSON.stringify(normalized);
}

/**
 * Simple hash function (JSON string based)
 */
function computeHashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    // Convert to 32-bit signed integer.
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function computeHash(input: unknown): string {
  return computeHashString(stableStringifyForHash(input));
}

/**
 * Compute hash from arbitrary object shape
 */
export function computeSettingsSchemaHashFrom(obj: unknown): string {
  // Exclude __schemaHash and ensure deterministic key ordering.
  const filtered = obj && typeof obj === 'object' ? obj : {};
  return computeHashString(stableStringifyForHash(filtered));
}

/**
 * Compute hash of current DEFAULT_SETTINGS schema
 */
export function computeCurrentSettingsSchemaHash(): string {
  return computeSettingsSchemaHashFrom(defaultSettings);
}

export const __private = { computeHash, computeHashString };
