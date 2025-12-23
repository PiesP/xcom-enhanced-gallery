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

function stableNormalizeForHash(input: unknown): unknown {
  if (input === null) return null;

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
    if (key === '__schemaHash') continue;
    const normalized = stableNormalizeForHash(obj[key]);
    if (normalized !== undefined) {
      out[key] = normalized;
    }
  }
  return out;
}

function stableStringifyForHash(input: unknown): string {
  const normalized = stableNormalizeForHash(input);
  return JSON.stringify(normalized ?? {});
}

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
 * Deterministic schema hash for unit tests and tooling.
 *
 * - Ignores __schemaHash
 * - Sorts object keys
 * - Preserves array order
 */
function computeSettingsSchemaHashFrom(obj: unknown): string {
  const filtered = obj && typeof obj === 'object' ? obj : {};
  return computeHashString(stableStringifyForHash(filtered));
}

/**
 * Compute hash of current DEFAULT_SETTINGS schema
 */
export function computeCurrentSettingsSchemaHash(): string {
  return SETTINGS_SCHEMA_HASH;
}
