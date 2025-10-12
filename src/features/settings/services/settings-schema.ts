/**
 * @fileoverview Settings schema hashing utilities
 * @description Compute a stable hash of the AppSettings shape to detect schema drift.
 * The hash is derived from key paths and primitive types, not from runtime values,
 * and excludes volatile/internal fields like __schemaHash.
 */

import { DEFAULT_SETTINGS as defaultSettings } from '../types/settings.types';

/** DJB2 hash to hex */
function djb2(str: string): string {
  let hash = 5381 >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0; // hash * 33 + c
  }
  return hash.toString(16);
}

/**
 * Build a deterministic signature from an object shape: a sorted list of
 * path:type entries. Only object keys and primitive typeof are considered.
 * Arrays are treated as 'array' leafs. Null is treated as 'null'.
 */
function buildShapeSignature(input: unknown, prefix = ''): string[] {
  if (input === null) return [`${prefix}:null`];
  const t = typeof input;
  if (t !== 'object') return [`${prefix}:${t}`];

  // Arrays -> leaf marker
  if (Array.isArray(input)) return [`${prefix}:array`];

  const rec = input as Record<string, unknown>;
  const keys = Object.keys(rec)
    .filter(k => k !== '__schemaHash')
    .sort();

  const out: string[] = [];
  for (const key of keys) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    out.push(...buildShapeSignature(rec[key], nextPrefix));
  }
  return out;
}

/** Compute hash from arbitrary object shape */
export function computeSettingsSchemaHashFrom(obj: unknown): string {
  const signature = buildShapeSignature(obj).join('\n');
  return djb2(signature);
}

/** Compute hash of the current DEFAULT_SETTINGS schema */
export function computeCurrentSettingsSchemaHash(): string {
  return computeSettingsSchemaHashFrom(defaultSettings);
}

export const __private = { buildShapeSignature, djb2 };
