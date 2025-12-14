/**
 * @fileoverview Signal Factory - Idiomatic SolidJS Patterns
 *
 * Provides signal abstractions using native SolidJS primitives.
 * Error handling is delegated to component-level <ErrorBoundary>.
 *
 * @see https://www.solidjs.com/docs/latest/api#createsignal
 */

import { createLogger, createScopedLogger } from '@shared/logging';
import { createEffect, createRoot, createSignal } from 'solid-js';

// Debug: Log module load for diagnosing duplicate runtime instances during tests
const logger = createScopedLogger?.('SignalFactory') ?? createLogger({ prefix: '[SignalFactory]' });
const debug = (...args: unknown[]): void => {
  logger?.debug?.(...args);
};

debug('Module loaded');

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
  const subscribers = new Set<(value: T) => void>();

  const notify = (val: T): void => {
    debug('[createSignalSafe]', instanceId, 'subscription callback invoked with', val);
    for (const subscriber of subscribers) {
      try {
        subscriber(val);
      } catch (error) {
        debug('[createSignalSafe]', instanceId, 'subscriber threw', error);
      }
    }
  };

  const signalObject = {
    subscribe(callback: (value: T) => void): () => void {
      // Debug: track subscriptions in tests; remove after stabilization
      debug('[createSignalSafe]', instanceId, 'subscribe invoked for signal', initial);
      debug('[createSignalSafe]', instanceId, 'createEffect for subscription (manual dispatch)');

      subscribers.add(callback);
      notify(read());

      return () => {
        subscribers.delete(callback);
      };
    },
  } as SafeSignal<T>;

  Object.defineProperty(signalObject, 'value', {
    get: () => {
      const value = read();
      debug('[createSignalSafe]', instanceId, 'value getter read', value);
      return value;
    },
    // Solid's `write` is overloaded and cannot be directly typed in this wrapper. Cast it to a compatible
    // signature at runtime while preserving a correct parameter type for callers.
    set: (v: Parameters<typeof write>[0]) =>
      ((val) => {
        debug('[createSignalSafe]', instanceId, 'value setter fired', val);
        // Resolve the new value BEFORE calling write to avoid stale values
        // when inside SolidJS batch(). After write() inside batch, read()
        // may return stale value until batch completes.
        const prevValue = read();
        const resolvedValue = typeof val === 'function' ? (val as (prev: T) => T)(prevValue) : val;
        (write as unknown as (arg: Parameters<typeof write>[0]) => void)(val);
        notify(resolvedValue as T);
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
    debug('[effectSafe] createRoot invoked');
    createEffect(() => {
      ran = true;
      debug('[effectSafe] effect body invoked');
      return fn();
    });

    if (!ran) {
      ran = true;
      debug('[effectSafe] immediate fallback effect body invoked');
      fn();
    }

    return dispose;
  });
}
