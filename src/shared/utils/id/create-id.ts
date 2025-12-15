/**
 * @fileoverview ID generation utilities
 * @description Small helpers to create stable, unique identifiers.
 *
 * Design goals:
 * - Prefer crypto.randomUUID() when available
 * - Provide a compact fallback for older environments
 * - Avoid legacy APIs like String.prototype.substr
 */

export function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      // Remove dashes to keep IDs compact for logs and DOM attributes.
      return crypto.randomUUID().replaceAll('-', '');
    }
  } catch {
    // Ignore and fall back.
  }

  // Fallback: time + random base36 suffix.
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export function createPrefixedId(prefix: string, separator = '_'): string {
  return `${prefix}${separator}${createId()}`;
}

export function createContextId(context: string): string {
  return createPrefixedId(context, ':');
}
