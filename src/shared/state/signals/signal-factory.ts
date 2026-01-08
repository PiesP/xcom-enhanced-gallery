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
 *
 * @template T - Type of the signal value
 */
export interface SafeSignal<T> {
  /** Current value of the signal (read/write property) */
  value: T;
  /**
   * Set a new value explicitly (safe for function-typed values).
   *
   * @param value - New value to set
   */
  set: (value: T) => void;
  /**
   * Update value using previous value (explicit updater API).
   *
   * @param updater - Function that receives previous value and returns new value
   */
  update: (updater: (prev: T) => T) => void;
  /**
   * Subscribe to value changes. Callback is invoked immediately with current value.
   *
   * @param callback - Function to call when value changes
   * @returns Unsubscribe function to remove the listener
   */
  subscribe: (callback: (value: T) => void) => () => void;
}

/**
 * Create a reactive signal with SolidJS.
 *
 * Uses native createSignal internally. The wrapper provides:
 * - `.value` property for get/set access
 * - `.set()` method for explicit value updates (safe for function values)
 * - `.update()` method for updater-based modifications
 * - `.subscribe()` method for external subscriptions
 *
 * Error handling is NOT done here - use <ErrorBoundary> at component level.
 *
 * @template T - Type of the signal value
 * @param initial - Initial signal value
 * @returns SafeSignal interface with reactive value access
 *
 * @example
 * ```typescript
 * const count = createSignalSafe(0);
 * console.log(count.value); // 0
 * count.set(5);
 * count.update(n => n + 1);
 * const unsubscribe = count.subscribe(value => console.log(value));
 * ```
 */
export function createSignalSafe<T>(initial: T): SafeSignal<T> {
  const [read, write] = createSignal<T>(initial, { equals: false });
  const setSignal = write as (value: T | ((prev: T) => T)) => void;
  const subscribers = new Set<(value: T) => void>();

  const notify = (value: T): void => {
    for (const subscriber of subscribers) {
      subscriber(value);
    }
  };

  const setValue = (value: T): void => {
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
    return (): void => {
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
 * @param fn - Effect function to run reactively. Automatically tracks dependencies.
 * @returns Dispose function to stop the effect and clean up resources
 *
 * @example
 * ```typescript
 * const count = createSignalSafe(0);
 * const dispose = effectSafe(() => {
 *   console.log('Count:', count.value);
 * });
 * // Later: dispose() to clean up
 * ```
 */
export function effectSafe(fn: () => void): () => void {
  return createRoot((dispose) => {
    createComputed(fn);

    return dispose;
  });
}
