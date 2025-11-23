/**
 * @fileoverview Solid.js utility helper functions
 * @description Phase 141.3: Accessor type conversion helper, remove type assertions
 */

import type { Accessor } from "solid-js";

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
  return typeof value === "function" ? (value as Accessor<T>) : () => value;
}

/**
 * Type Guard: Validate Accessor type
 *
 * @param value Value to validate
 * @returns Whether value is Accessor type (checks if it's a function)
 */
export function isAccessor<T = unknown>(value: unknown): value is Accessor<T> {
  return typeof value === "function";
}

/**
 * Type Guard: Validate HTMLElement type
 * Phase 141.3: Remove type assertions from event.target
 *
 * @param value Value to validate
 * @returns Whether value is HTMLElement type
 */
export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}
