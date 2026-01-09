/**
 * Generates a unique ID using crypto.randomUUID, with fallback to time-based ID.
 * @returns Compact unique identifier without dashes.
 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replaceAll('-', '');
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

/**
 * Generates a prefixed unique ID.
 * @param prefix - The prefix for the ID
 * @param separator - Separator between prefix and ID (default: '_')
 * @returns Prefixed ID in format: `{prefix}{separator}{id}`
 */
export function createPrefixedId(prefix: string, separator = '_'): string {
  return `${prefix}${separator}${createId()}`;
}
