/**
 * @fileoverview Reactive Accessor Utilities
 * @description SolidJS Reactive 값 접근을 위한 타입 안전 유틸리티
 */
import { getSolidCore } from '@shared/external/vendors';

export type ReactiveValue<T> = T | (() => T);

/**
 * Reactive 값을 안전하게 resolve
 * @param value - Primitive 또는 Accessor
 * @returns 실제 값
 *
 * @example
 * ```ts
 * const num = resolve(42); // 42
 * const fromAccessor = resolve(() => 100); // 100
 * ```
 */
export function resolve<T>(value: ReactiveValue<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}

/**
 * Reactive 값을 기본값과 함께 resolve
 * @param value - Primitive 또는 Accessor
 * @param defaultValue - 기본값
 * @returns 실제 값 또는 기본값
 *
 * @example
 * ```ts
 * const safe = resolveWithDefault(null, 99); // 99
 * const value = resolveWithDefault(42, 0); // 42
 * ```
 */
export function resolveWithDefault<T>(
  value: ReactiveValue<T | null | undefined>,
  defaultValue: T
): T {
  const resolved = resolve(value);
  return resolved ?? defaultValue;
}

/**
 * Reactive 배열을 memoized accessor로 변환
 * @param values - Accessor 배열 또는 값 배열
 * @returns Memoized accessor
 *
 * @example
 * ```ts
 * const combined = combineAccessors([count, () => 2, 3]);
 * combined(); // [1, 2, 3]
 * ```
 */
export function combineAccessors<T>(values: ReactiveValue<T>[]): () => T[] {
  const solid = getSolidCore();
  const { createMemo } = solid;
  return createMemo(() => values.map(v => resolve(v)));
}
