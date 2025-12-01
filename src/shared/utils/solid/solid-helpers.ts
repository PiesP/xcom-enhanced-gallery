/**
 * @fileoverview Solid.js utility helper functions
 * @description Phase 141.3: Accessor type conversion helper, remove type assertions
 *              Phase 602: Accessor utilities consolidated from Toolbar/accessor-utils.ts
 * @version 2.0.0 - Unified accessor utilities
 */

import type { Accessor } from 'solid-js';

// ============================================================================
// Types
// ============================================================================

/**
 * Value that may be either a plain value or an Accessor (function returning value)
 */
export type MaybeAccessor<T> = T | Accessor<T>;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is an Accessor (function)
 */
export const isAccessor = <T>(value: MaybeAccessor<T> | undefined): value is Accessor<T> =>
  typeof value === 'function';

// ============================================================================
// Conversion Functions
// ============================================================================

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

/**
 * Resolve Accessor or plain value to its actual value
 *
 * @param value MaybeAccessor value (or undefined)
 * @returns Resolved value (or undefined)
 *
 * @example
 * ```typescript
 * resolveAccessorValue(5); // 5
 * resolveAccessorValue(() => 10); // 10
 * resolveAccessorValue(undefined); // undefined
 * ```
 */
export const resolveAccessorValue = <T>(value: MaybeAccessor<T> | undefined): T | undefined => {
  if (isAccessor(value)) {
    return value();
  }
  return value;
};

// ============================================================================
// Accessor Wrappers
// ============================================================================

/**
 * Create required Accessor with fallback value
 * Resolves MaybeAccessor and provides fallback if undefined
 *
 * @param resolver Function returning MaybeAccessor
 * @param fallback Default value when resolved value is undefined
 * @returns Accessor that always returns a value
 *
 * @example
 * ```typescript
 * const count = toRequiredAccessor(() => props.count, 0);
 * count(); // returns props.count or 0 if undefined
 * ```
 */
export const toRequiredAccessor = <T>(
  resolver: () => MaybeAccessor<T> | undefined,
  fallback: T
): Accessor<T> => {
  return () => {
    const resolved = resolveAccessorValue(resolver());
    return (resolved ?? fallback) as T;
  };
};

/**
 * Create optional Accessor (allows undefined)
 * Resolves MaybeAccessor without fallback
 *
 * @param resolver Function returning MaybeAccessor
 * @returns Accessor that may return undefined
 *
 * @example
 * ```typescript
 * const label = toOptionalAccessor(() => props.label);
 * label(); // returns props.label or undefined
 * ```
 */
export const toOptionalAccessor = <T>(
  resolver: () => MaybeAccessor<T> | undefined
): Accessor<T | undefined> => {
  return () => resolveAccessorValue(resolver());
};
