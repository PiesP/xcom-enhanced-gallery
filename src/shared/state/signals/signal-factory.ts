/**
 * @fileoverview Signal Factory - Idiomatic SolidJS Patterns
 *
 * Provides signal abstractions using native SolidJS primitives.
 * Error handling is delegated to component-level <ErrorBoundary>.
 *
 * @see https://www.solidjs.com/docs/latest/api#createsignal
 */

import { createComputed, createRoot, createSignal } from 'solid-js';

/**
 * Signal interface providing value access and subscription capability.
 * This abstraction allows signals to be used outside reactive contexts.
 */
export type SafeSignal<T> = {
  /** Current value of the signal */
  value: T;
  /** Set a new value explicitly (safe for function-typed values). */
  set: (value: T) => void;
  /** Update value using previous value (explicit updater API). */
  update: (updater: (prev: T) => T) => void;
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
  const setSignal = write as (value: T | ((prev: T) => T)) => void;
  const subscribers = new Set<(value: T) => void>();

  const notify = (value: T): void => {
    for (const subscriber of subscribers) {
      subscriber(value);
    }
  };

  const setValue = (value: T): void => {
    // Solid treats function inputs as updaters. When the *value* itself is a function,
    // wrap it to avoid accidental invocation.
    if (typeof value === 'function') {
      setSignal(() => value);
    } else {
      setSignal(value);
    }
    notify(value);
  };

  const updateValue = (updater: (prev: T) => T): void => {
    const nextValue = updater(read());
    setSignal(updater);
    notify(nextValue);
  };

  const subscribe = (callback: (value: T) => void): (() => void) => {
    subscribers.add(callback);
    callback(read());
    return () => {
      subscribers.delete(callback);
    };
  };

  return {
    get value() {
      return read();
    },
    set value(v: T) {
      setValue(v);
    },
    set: setValue,
    update: updateValue,
    subscribe,
  };
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
    createComputed(fn);

    return dispose;
  });
}
