/**
 * @fileoverview Settings schema hashing utilities
 * @description Compute stable hash of AppSettings shape to detect schema drift.
 */

/**
 * Manual schema hash.
 *
 * Bump this value whenever the persisted settings shape changes in a way that
 * should trigger a migration re-save.
 */
const SETTINGS_SCHEMA_HASH = '1';

/**
 * Recursively normalizes input data for deterministic hash computation.
 *
 * Normalization rules:
 * - Primitives (string, number, boolean) are preserved as-is
 * - null is preserved as null
 * - undefined and non-object/array types are converted to undefined
 * - Arrays are recursively normalized, preserving order
 * - Objects are recursively normalized with sorted keys, excluding `__schemaHash`
 * - undefined values in normalized objects are omitted
 *
 * @param input - The value to normalize
 * @returns Normalized value suitable for JSON serialization, or undefined if input is invalid
 */
function stableNormalizeForHash(input: unknown): unknown {
  if (input === null) {
    return null;
  }

  const type = typeof input;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return input;
  }

  if (type !== 'object') {
    return undefined;
  }

  if (Array.isArray(input)) {
    return input.map((value) => stableNormalizeForHash(value));
  }

  const obj = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    if (key === '__schemaHash') {
      continue;
    }
    const normalized = stableNormalizeForHash(obj[key]);
    if (normalized !== undefined) {
      out[key] = normalized;
    }
  }
  return out;
}

/**
 * Converts normalized data to deterministic JSON string.
 *
 * @param input - The value to stringify (will be normalized first)
 * @returns JSON string representation of normalized input, or `{}` if input is undefined
 */
function stableStringifyForHash(input: unknown): string {
  const normalized = stableNormalizeForHash(input);
  return JSON.stringify(normalized ?? {});
}

/**
 * Computes a stable hash code from a string using a simple hash algorithm.
 *
 * Implementation:
 * - Uses djb2-like hash algorithm (bit-shift and subtraction)
 * - Returns absolute value as hexadecimal string
 * - Produces consistent results for identical inputs
 *
 * @param str - The string to hash
 * @returns Hexadecimal hash string (always positive)
 */
function computeHashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Computes deterministic schema hash from arbitrary object for unit tests and tooling.
 *
 * Hash computation process:
 * 1. Normalizes input (sorts keys, excludes `__schemaHash`, handles primitives/arrays/objects)
 * 2. Converts to stable JSON string
 * 3. Computes hash code from string
 *
 * Features:
 * - Deterministic: same input always produces same hash
 * - Order-independent for object keys (sorted)
 * - Order-dependent for array elements (preserved)
 * - Ignores `__schemaHash` field
 *
 * @param obj - The object to compute hash from (will be normalized first)
 * @returns Hexadecimal hash string representing the normalized object structure
 */
export function computeSettingsSchemaHashFrom(obj: unknown): string {
  const filtered = obj && typeof obj === 'object' ? obj : {};
  return computeHashString(stableStringifyForHash(filtered));
}

/**
 * Returns the current settings schema hash version.
 *
 * This hash should be manually incremented when the persisted settings shape changes
 * in a way that requires migration or re-save. It serves as a schema version identifier.
 *
 * @returns The current schema hash version string
 */
export function computeCurrentSettingsSchemaHash(): string {
  return SETTINGS_SCHEMA_HASH;
}
