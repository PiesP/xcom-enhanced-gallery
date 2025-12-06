/**
 * @fileoverview Signal Factory - Idiomatic SolidJS Patterns
 *
 * Provides signal abstractions using native SolidJS primitives.
 * Error handling is delegated to component-level <ErrorBoundary>.
 *
 * @see https://www.solidjs.com/docs/latest/api#createsignal
 */

import { createEffect, createMemo, createRoot, createSignal } from 'solid-js';

/**
 * Signal interface providing value access and subscription capability.
 * This abstraction allows signals to be used outside reactive contexts.
 */
export type SafeSignal<T> = {
  /** Current value of the signal */
  value: T;
  /** Subscribe to value changes. Returns unsubscribe function. */
  subscribe: (callback: (value: T) => void) => () => void;
};

/**
 * Create a reactive signal with SolidJS.
 *
 * Uses native createSignal internally. The wrapper provides:
 * - `.value` property for get/set access
 * - `.subscribe()` method for external subscriptions
 *
 * Error handling is NOT done here - use <ErrorBoundary> at component level.
 *
 * @param initial - Initial signal value
 * @returns SafeSignal interface
 */
export function createSignalSafe<T>(initial: T): SafeSignal<T> {
  const [read, write] = createSignal(initial, { equals: false });

  const signalObject = {
    subscribe(callback: (value: T) => void): () => void {
      return createRoot((dispose) => {
        createEffect(() => callback(read()));
        return dispose;
      });
    },
  } as SafeSignal<T>;

  Object.defineProperty(signalObject, 'value', {
    get: () => read(),
    set: (v: T) => write(() => v),
    enumerable: true,
  });

  return signalObject;
}

/**
 * Create a reactive effect with SolidJS.
 *
 * Wraps effect in createRoot for use outside component context.
 * Returns dispose function to clean up the effect.
 *
 * @param fn - Effect function to run reactively
 * @returns Dispose function
 */
export function effectSafe(fn: () => void): () => void {
  return createRoot((dispose) => {
    createEffect(() => fn());
    return dispose;
  });
}

/**
 * Create a memoized computed value with SolidJS.
 *
 * Uses native createMemo internally.
 *
 * @param compute - Computation function
 * @returns Object with readonly value property
 */
export function computedSafe<T>(compute: () => T): { readonly value: T } {
  let memoAccessor: (() => T) | null = null;

  createRoot((dispose) => {
    memoAccessor = createMemo(compute);
    return () => {
      memoAccessor = null;
      dispose();
    };
  });

  return {
    get value() {
      return memoAccessor ? memoAccessor() : compute();
    },
  } as const;
}
