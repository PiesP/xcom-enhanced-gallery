/**
 * @fileoverview Signal Factory - SolidJS native createSignal wrapper.
 *
 * Provides a thin wrapper around SolidJS createSignal for use outside
 * component contexts (e.g., global state modules).
 */

import { createComputed, createRoot, createSignal } from 'solid-js';

/**
 * Signal accessor type: [getter, setter] tuple from SolidJS createSignal.
 */
export type Signal<T> = ReturnType<typeof createSignal<T>>;

/**
 * Create a reactive signal for use outside SolidJS components.
 * Returns a getter/setter pair compatible with SolidJS reactivity.
 *
 * @template T - Type of the signal value
 * @param initial - Initial signal value
 * @returns Tuple of [getter, setter]
 */
export function createSignalSafe<T>(initial: T): Signal<T> {
  return createSignal<T>(initial, { equals: false });
}

/**
 * Create a reactive effect with SolidJS outside component context.
 * Wraps effect in createRoot for proper cleanup.
 *
 * @param fn - Effect function to run reactively
 * @returns Dispose function to stop the effect
 */
export function effectSafe(fn: () => void): () => void {
  return createRoot((dispose) => {
    createComputed(fn);
    return dispose;
  });
}
