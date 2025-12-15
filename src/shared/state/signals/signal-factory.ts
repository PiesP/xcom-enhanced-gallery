/**
 * @fileoverview Signal Factory - Idiomatic SolidJS Patterns
 *
 * Provides signal abstractions using native SolidJS primitives.
 * Error handling is delegated to component-level <ErrorBoundary>.
 *
 * @see https://www.solidjs.com/docs/latest/api#createsignal
 */

import { createLogger, createScopedLogger } from '@shared/logging';
import { createComputed, createRoot, createSignal } from 'solid-js';

// Debug: Log module load for diagnosing duplicate runtime instances during tests
const logger = createScopedLogger?.('SignalFactory') ?? createLogger({ prefix: '[SignalFactory]' });
const debugLogger = __DEV__ ? logger?.debug?.bind(logger) : undefined;
const debug = (...args: unknown[]): void => {
  debugLogger?.(...args);
};

debug('Module loaded');

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
  // Solid's Setter<T> overloads intentionally reject direct function values.
  // We handle function-typed values explicitly and use a simplified signature internally.
  const setSignal = write as (value: T | ((prev: T) => T)) => void;
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
    set(value: T): void {
      debug('[createSignalSafe]', instanceId, 'set invoked', value);

      // Solid treats function inputs as updaters. When the *value* itself is a
      // function, wrap it to avoid accidental invocation.
      if (typeof value === 'function') {
        setSignal(() => value);
      } else {
        setSignal(value);
      }

      notify(value);
    },
    update(updater: (prev: T) => T): void {
      debug('[createSignalSafe]', instanceId, 'update invoked');

      // Resolve next value before calling write() to avoid stale reads inside
      // SolidJS batch().
      const prevValue = read();
      const nextValue = updater(prevValue);
      setSignal(updater);
      notify(nextValue);
    },
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
    set: (v: T) => {
      debug('[createSignalSafe]', instanceId, 'value setter fired', v);
      signalObject.set(v);
    },
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
    debug('[effectSafe] createRoot invoked');

    // Use createComputed so this helper works reliably outside of a component
    // render cycle (including unit tests running under JSDOM). It still tracks
    // dependencies and re-runs when they change.
    createComputed(() => {
      debug('[effectSafe] effect body invoked');
      fn();
    });

    return dispose;
  });
}
