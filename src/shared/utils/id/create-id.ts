/**
 * @fileoverview ID generation utilities
 * @description Small helpers to create stable, unique identifiers.
 *
 * Design goals:
 * - Prefer crypto.randomUUID() when available
 * - Provide a compact fallback for older environments
 * - Avoid legacy APIs like String.prototype.substr
 */

/**
 * Generates a unique ID using the Web Crypto API when available,
 * falling back to a time-based random string for older environments.
 *
 * @returns A compact, unique identifier (32 chars with crypto, variable with fallback)
 *
 * @example
 * const id = createId();
 * // crypto available: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
 * // fallback: '1f2c3a4b5c6d7e8f9'
 */
export function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      // Remove dashes to keep IDs compact for logs and DOM attributes.
      return crypto.randomUUID().replaceAll('-', '');
    }
  } catch {
    // Ignore crypto errors and fall back.
  }

  // Fallback: time-based ID + random base36 suffix.
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

/**
 * Generates a prefixed unique ID with a configurable separator.
 *
 * @param prefix - The prefix for the ID (e.g., 'widget', 'dialog')
 * @param separator - The separator between prefix and ID (default: '_')
 * @returns A prefixed ID in the format: `{prefix}{separator}{id}`
 *
 * @example
 * createPrefixedId('toolbar', '_');    // 'toolbar_a1b2c3d4...'
 * createPrefixedId('btn', '-');        // 'btn-a1b2c3d4...'
 * createPrefixedId('xeg');             // 'xeg_a1b2c3d4...'
 */
export function createPrefixedId(prefix: string, separator = '_'): string {
  return `${prefix}${separator}${createId()}`;
}
