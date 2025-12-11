/**
 * @fileoverview Signal Factory - Idiomatic SolidJS Patterns
 *
 * Provides signal abstractions using native SolidJS primitives.
 * Error handling is delegated to component-level <ErrorBoundary>.
 *
 * @see https://www.solidjs.com/docs/latest/api#createsignal
 */

import { createEffect, createRoot, createSignal } from 'solid-js';

// Debug: Log module load for diagnosing duplicate runtime instances during tests
// eslint-disable-next-line no-console
console.log('[signal-factory] module loaded');

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
  const instanceId = Math.random().toString(36).slice(2, 10);

  const signalObject = {
    subscribe(callback: (value: T) => void): () => void {
      // Debug: track subscriptions in tests; remove after stabilization
      // eslint-disable-next-line no-console
      console.debug('[createSignalSafe]', instanceId, 'subscribe invoked for signal', initial);
      return createRoot((dispose) => {
        // eslint-disable-next-line no-console
        console.debug('[createSignalSafe]', instanceId, 'createEffect for subscription');
        createEffect(() => {
          const val = read();
          // eslint-disable-next-line no-console
          console.debug('[createSignalSafe]', instanceId, 'subscription callback invoked with', val);
          return callback(val);
        });
        return dispose;
      });
    },
  } as SafeSignal<T>;

  Object.defineProperty(signalObject, 'value', {
    get: () => {
      const value = read();
      // eslint-disable-next-line no-console
      console.debug('[createSignalSafe]', instanceId, 'value getter read', value);
      return value;
    },
    // Solid's `write` is overloaded and cannot be directly typed in this wrapper. Cast it to a compatible
    // signature at runtime while preserving a correct parameter type for callers.
    set: (v: Parameters<typeof write>[0]) =>
      // eslint-disable-next-line no-console
      ((val) => {
        console.debug('[createSignalSafe]', instanceId, 'value setter fired', val);
        return (write as unknown as (arg: Parameters<typeof write>[0]) => void)(val);
      })(v),
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
    // Attempt to run reactively; also ensure immediate initial run if the
    // reactive runtime defers initial execution in the current environment.
    let ran = false;
    // eslint-disable-next-line no-console
    console.debug('[effectSafe] createRoot invoked');
    createEffect(() => {
      ran = true;
      // eslint-disable-next-line no-console
      console.debug('[effectSafe] effect body invoked');
      return fn();
    });
    // Fallback: If createEffect didn't run synchronously due to the environment
    // scheduling/reactive microtask strategy, schedule a microtask to create
    // another reactive effect that will guarantee the initial run while
    // preserving dependency tracking. We do not call `fn` directly here
    // because that would bypass Solid's tracking semantics.
    const scheduleFallback = (cb: () => void) =>
      (typeof queueMicrotask === 'function'
        ? queueMicrotask(cb)
        : Promise.resolve().then(cb));

    scheduleFallback(() => {
      if (!ran) {
        // Install a second effect inside the same root as a fallback to ensure
        // dependencies are tracked even if the initial createEffect was
        // deferred. This will set `ran` to true when it executes so future
        // scheduled fallbacks are no-ops.
        createEffect(() => {
          ran = true;
          // eslint-disable-next-line no-console
          console.debug('[effectSafe] fallback effect body invoked');
          return fn();
        });
      }
    });
    return dispose;
  });
}
