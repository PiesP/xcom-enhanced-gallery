import type { Accessor } from 'solid-js';
export type MaybeAccessor<T> = T | Accessor<T>;

export function isAccessor<T = unknown>(value: unknown): value is Accessor<T> {
  return typeof value === 'function';
}

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
export function toAccessor<T>(value: MaybeAccessor<T>): Accessor<T> {
  return typeof value === 'function' ? (value as Accessor<T>) : () => value;
}
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
export function toOptionalAccessor<T>(
  resolver: () => MaybeAccessor<T> | undefined
): Accessor<T | undefined> {
  return () => resolveOptional(resolver());
}
