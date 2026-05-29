// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Object path utilities — resolve nested properties by dot-notation path
 */

/** Resolve nested object property by dot-notation path */
export function resolveNestedPath<T = unknown>(source: unknown, path: string): T | undefined {
  if (typeof path !== 'string' || path === '') return undefined;

  let current: unknown = source;
  for (const segment of path.split('.')) {
    if (!segment || current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }

  return current as T | undefined;
}
