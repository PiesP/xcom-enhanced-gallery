import type { Accessor } from 'solid-js';

/**
 * A union type representing a value that could be either a direct value or an accessor function.
 *
 * Use this type for props and parameters that accept both static values and reactive accessors.
 * This pattern is common in Solid.js for maximum flexibility.
 *
 * @example
 * ```typescript
 * type MyProps = {
 *   label: MaybeAccessor<string>;
 *   count: MaybeAccessor<number>;
 * };
 *
 * // Usage with direct values
 * <MyComponent label="Hello" count={42} />
 *
 * // Usage with accessors
 * const [name] = createSignal('World');
 * <MyComponent label={name} count={() => 10} />
 * ```
 */
export type MaybeAccessor<T> = T | Accessor<T>;

/**
 * Resolve a MaybeAccessor to its actual value.
 *
 * If the value is a function (Accessor), it will be called and the result returned.
 * Otherwise, the value is returned directly.
 *
 * @param value - A value or accessor function
 * @returns The resolved value
 *
 * @example
 * ```typescript
 * const count = resolve(42); // 42
 * const name = resolve(() => 'Alice'); // 'Alice'
 * ```
 */
export function resolve<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? (value as Accessor<T>)() : value;
}

/**
 * Resolve MaybeAccessor with support for undefined values.
 *
 * Use this when the value might be undefined and you want to preserve that.
 * Returns undefined early without calling resolve() to maintain clarity.
 *
 * @param value - A MaybeAccessor value (or undefined)
 * @returns The resolved value, or undefined if input was undefined
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

/**
 * Convert a MaybeAccessor to an Accessor function.
 *
 * Ensures the result is always a function (Accessor) that can be used
 * with Solid.js reactive features like createMemo, createEffect, etc.
 *
 * @param value - A value or accessor function
 * @returns An accessor function that returns the value
 *
 * @example
 * ```typescript
 * toAccessor(42); // () => 42
 * toAccessor(() => 10); // () => 10 (returned as-is)
 *
 * // Useful for normalizing props in reactive contexts
 * const getValue = toAccessor(props.value);
 * createMemo(() => getValue() * 2);
 * ```
 */
export function toAccessor<T>(value: MaybeAccessor<T>): Accessor<T> {
  return typeof value === 'function' ? (value as Accessor<T>) : () => value;
}

/**
 * Convert a resolver function to an Accessor that returns a required value with fallback.
 *
 * This is useful for scenarios where you need to dynamically resolve a value from a function,
 * but want to ensure a non-undefined value is always returned using a fallback.
 *
 * @param resolver - A function that returns a MaybeAccessor or undefined
 * @param fallback - The value to return if resolver returns undefined
 * @returns An accessor function that resolves the value or returns the fallback
 *
 * @example
 * ```typescript
 * const getValue = toRequiredAccessor(
 *   () => props.value,
 *   'default'
 * );
 * // If props.value is undefined, getValue() returns 'default'
 * // If props.value is 'hello', getValue() returns 'hello'
 * // If props.value is () => 'world', getValue() returns 'world'
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
 * Convert a resolver function to an Accessor that optionally returns a value.
 *
 * This is useful for scenarios where you need to dynamically resolve a value from a function,
 * but want to preserve undefined if no value is available.
 *
 * @param resolver - A function that returns a MaybeAccessor or undefined
 * @returns An accessor function that resolves the value or returns undefined
 *
 * @example
 * ```typescript
 * const getValue = toOptionalAccessor(
 *   () => props.optionalValue
 * );
 * // If props.optionalValue is undefined, getValue() returns undefined
 * // If props.optionalValue is 'hello', getValue() returns 'hello'
 * // If props.optionalValue is () => 'world', getValue() returns 'world'
 * ```
 */
export function toOptionalAccessor<T>(
  resolver: () => MaybeAccessor<T> | undefined
): Accessor<T | undefined> {
  return () => resolveOptional(resolver());
}
