import type { Accessor } from 'solid-js';

/**
 * Union type for a value or accessor function.
 * @example
 * type Props = { label: MaybeAccessor<string> };
 * // Use directly or with createSignal signal
 */
export type MaybeAccessor<T> = T | Accessor<T>;

/**
 * Resolve a MaybeAccessor to its value.
 * @param value - A value or accessor function
 * @returns The resolved value
 * @example
 * resolve(42) // 42
 * resolve(() => 'Alice') // 'Alice'
 */
export function resolve<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? (value as Accessor<T>)() : value;
}

/**
 * Resolve MaybeAccessor with optional value support.
 * @param value - A MaybeAccessor value (or undefined)
 * @returns The resolved value, or undefined if input was undefined
 * @example
 * resolveOptional(undefined) // undefined
 * resolveOptional(() => 'text') // 'text'
 */
export function resolveOptional<T>(value: MaybeAccessor<T> | undefined): T | undefined {
  return value === undefined ? undefined : resolve(value);
}

/**
 * Convert a MaybeAccessor to an Accessor function.
 * @param value - A value or accessor function
 * @returns An accessor function that returns the value
 * @example
 * toAccessor(42) // () => 42
 * const getValue = toAccessor(props.value);
 * createMemo(() => getValue() * 2);
 */
export function toAccessor<T>(value: MaybeAccessor<T>): Accessor<T> {
  return typeof value === 'function' ? (value as Accessor<T>) : () => value;
}

/**
 * Convert a resolver to an Accessor that returns a required value with fallback.
 * @param resolver - A function that returns a MaybeAccessor or undefined
 * @param fallback - The value to return if resolver returns undefined
 * @returns An accessor function that resolves the value or returns the fallback
 * @example
 * const getValue = toRequiredAccessor(() => props.value, 'default');
 * getValue() // Returns 'default' or resolved value
 */
export function toRequiredAccessor<T>(
  resolver: () => MaybeAccessor<T> | undefined,
  fallback: T
): Accessor<T> {
  return () => {
    const resolved = resolveOptional(resolver());
    return (resolved ?? fallback) as T;
  };
}

/**
 * Convert a resolver to an Accessor that optionally returns a value.
 * @param resolver - A function that returns a MaybeAccessor or undefined
 * @returns An accessor function that resolves the value or returns undefined
 * @example
 * const getValue = toOptionalAccessor(() => props.optionalValue);
 * getValue() // Returns undefined or resolved value
 */
export function toOptionalAccessor<T>(
  resolver: () => MaybeAccessor<T> | undefined
): Accessor<T | undefined> {
  return () => resolveOptional(resolver());
}
