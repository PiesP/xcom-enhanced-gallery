// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { Accessor } from 'solid-js';
import { createComputed, createRoot } from 'solid-js';

/**
 * Union type for a value or accessor function.
 * @example
 * ```ts
 * type Props = { label: MaybeAccessor<string> };
 * // Use directly or with createSignal signal
 * ```
 */
export type MaybeAccessor<T> = T | Accessor<T>;

/**
 * Resolve a MaybeAccessor to its value.
 * @param value - A value or accessor function
 * @returns The resolved value
 * @example
 * ```ts
 * resolve(42); // 42
 * resolve(() => 'Alice'); // 'Alice'
 * ```
 */
export function resolve<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? (value as Accessor<T>)() : value;
}

/**
 * Resolve MaybeAccessor with optional value support.
 * @param value - A MaybeAccessor value (or undefined)
 * @returns The resolved value, or undefined if input was undefined
 * @example
 * ```ts
 * _resolveOptional(undefined); // undefined
 * _resolveOptional(() => 'text'); // 'text'
 * ```
 */
function _resolveOptional<T>(value: MaybeAccessor<T> | undefined): T | undefined {
  return value === undefined ? undefined : resolve(value);
}

/**
 * Convert a MaybeAccessor to an Accessor function.
 * @param value - A value or accessor function
 * @returns An accessor function that returns the value
 * @example
 * ```ts
 * toAccessor(42); // () => 42
 * const getValue = toAccessor(props.value);
 * createMemo(() => getValue() * 2);
 * ```
 */
export function toAccessor<T>(value: MaybeAccessor<T>): Accessor<T> {
  return typeof value === 'function' ? (value as Accessor<T>) : () => value;
}

/**
 * Create a Solid.js reactive effect rooted in a createRoot.
 * Returns a dispose function for cleanup.
 *
 * This is the canonical way to create an effect-safe reactive root
 * outside of component trees. Use this instead of duplicating
 * createRoot + createComputed patterns.
 */
export function createEffectRoot(fn: () => void): () => void {
  return createRoot((dispose) => {
    createComputed(fn);
    return dispose;
  });
}
