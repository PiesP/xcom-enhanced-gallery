/**
 * @fileoverview Solid.js accessor utility functions
 * @description Consolidated accessor type and helper functions for MaybeAccessor pattern.
 *              This module provides standardized utilities for working with Solid.js accessors.
 * @version 1.0.0 - Consolidated from solid-helpers.ts
 */

import type { Accessor } from 'solid-js';

// ============================================================================
// Types
// ============================================================================

/**
 * Value that may be either a plain value or an Accessor (function returning value)
 *
 * @template T - The type of the value
 *
 * @example
 * ```typescript
 * type StringOrAccessor = MaybeAccessor<string>;
 * const value1: StringOrAccessor = 'hello'; // Plain value
 * const value2: StringOrAccessor = () => 'world'; // Accessor
 * ```
 */
export type MaybeAccessor<T> = T | Accessor<T>;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is an Accessor (function)
 *
 * @param value - Value to check
 * @returns True if value is an Accessor function
 *
 * @example
 * ```typescript
 * if (isAccessor(props.value)) {
 *   console.log(props.value()); // Safe to call as function
 * }
 * ```
 */
export const isAccessor = <T>(value: MaybeAccessor<T> | undefined): value is Accessor<T> =>
  typeof value === 'function';

// ============================================================================
// Resolution Functions
// ============================================================================

/**
 * Resolve MaybeAccessor to its actual value
 *
 * This is the primary function for unwrapping MaybeAccessor values.
 * Use this when you need the actual value regardless of whether it's
 * a plain value or an accessor function.
 *
 * @param value - MaybeAccessor value to resolve
 * @returns Resolved value
 *
 * @example
 * ```typescript
 * const name = resolve(props.name); // Returns string regardless of accessor or value
 * const count = resolve(() => 42); // Returns 42
 * const text = resolve('hello'); // Returns 'hello'
 * ```
 */
export function resolve<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? (value as Accessor<T>)() : value;
}

/**
 * Resolve MaybeAccessor with support for undefined values
 *
 * Use this when the value might be undefined and you want to preserve that.
 *
 * @param value - MaybeAccessor value (or undefined)
 * @returns Resolved value (or undefined)
 *
 * @example
 * ```typescript
 * const label = resolveOptional(props.label); // string | undefined
 * resolveOptional(undefined); // undefined
 * resolveOptional(() => 'text'); // 'text'
 * ```
 */
export function resolveOptional<T>(value: MaybeAccessor<T> | undefined): T | undefined {
  if (value === undefined) {
    return undefined;
  }
  return resolve(value);
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert value to Accessor function
 *
 * Ensures the result is always an Accessor, wrapping plain values if needed.
 *
 * @param value - Plain value or existing Accessor
 * @returns Accessor function
 *
 * @example
 * ```typescript
 * const accessor1 = toAccessor(5); // () => 5
 * const accessor2 = toAccessor(() => 10); // () => 10 (no-op)
 * ```
 */
export function toAccessor<T>(value: MaybeAccessor<T>): Accessor<T> {
  return typeof value === 'function' ? (value as Accessor<T>) : () => value;
}

/**
 * Create required Accessor with fallback value
 *
 * Useful for providing default values when the source value might be undefined.
 *
 * @param resolver - Function returning MaybeAccessor
 * @param fallback - Default value when resolved value is undefined
 * @returns Accessor that always returns a value
 *
 * @example
 * ```typescript
 * const count = toRequiredAccessor(() => props.count, 0);
 * count(); // Returns props.count or 0 if undefined
 * ```
 */
export function toRequiredAccessor<T>(
  resolver: () => MaybeAccessor<T> | undefined,
  fallback: T
): Accessor<T> {
  return () => {
    const value = resolver();
    const resolved = resolveOptional(value);
    return (resolved ?? fallback) as T;
  };
}

/**
 * Create optional Accessor (allows undefined)
 *
 * Useful when you want to preserve undefined values in the accessor chain.
 *
 * @param resolver - Function returning MaybeAccessor
 * @returns Accessor that may return undefined
 *
 * @example
 * ```typescript
 * const label = toOptionalAccessor(() => props.label);
 * label(); // Returns props.label or undefined
 * ```
 */
export function toOptionalAccessor<T>(
  resolver: () => MaybeAccessor<T> | undefined
): Accessor<T | undefined> {
  return () => resolveOptional(resolver());
}
