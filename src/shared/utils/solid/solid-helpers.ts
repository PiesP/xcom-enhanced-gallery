/**
 * @fileoverview Solid.js utility helper functions
 * @description Phase 141.3: Accessor type conversion helper, remove type assertions
 */

import type { Accessor } from 'solid-js';

/**
 * Convert value to Accessor
 * Phase 141.3: Common helper to remove type assertions
 *
 * @param value Plain value or Accessor
 * @returns Accessor function
 *
 * @example
 * ```typescript
 * const accessor = toAccessor(5); // () => 5
 * const alreadyAccessor = toAccessor(() => 10); // () => 10
 * ```
 */
export function toAccessor<T>(value: T | Accessor<T>): Accessor<T> {
  return typeof value === 'function' ? (value as Accessor<T>) : () => value;
}
