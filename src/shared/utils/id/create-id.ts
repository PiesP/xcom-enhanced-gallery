// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Generates a unique ID using crypto.randomUUID.
 * @returns Compact unique identifier without dashes.
 */
export function createId(): string {
  return crypto.randomUUID().replaceAll('-', '');
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
