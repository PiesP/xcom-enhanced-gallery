/**
 * @fileoverview Signal Factory - Idiomatic SolidJS Patterns
 *
 * Provides signal abstractions using native SolidJS primitives.
 * Error handling is delegated to component-level <ErrorBoundary>.
 *
 * @see https://www.solidjs.com/docs/latest/api#createsignal
 */

import { createEffect, createRoot, createSignal } from "solid-js";

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

  Object.defineProperty(signalObject, "value", {
    get: () => read(),
    // Solid's `write` is overloaded and cannot be directly typed in this wrapper. Cast it to a compatible
    // signature at runtime while preserving a correct parameter type for callers.
    set: (v: Parameters<typeof write>[0]) =>
      (write as unknown as (arg: Parameters<typeof write>[0]) => void)(v),
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
