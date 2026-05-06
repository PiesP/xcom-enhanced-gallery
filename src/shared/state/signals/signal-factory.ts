/** @fileoverview Thin wrapper around SolidJS signals and effects for use outside component contexts. */

import { createComputed, createRoot } from 'solid-js';

export function effectSafe(fn: () => void): () => void {
  return createRoot((dispose) => {
    createComputed(fn);
    return dispose;
  });
}

/**
 * Simple signal wrapper for use outside component contexts.
 * Provides .value get/set, .set(), and .subscribe() methods.
 */
export interface SignalSafe<T> {
  get value(): T;
  set value(v: T);
  set(v: T): void;
  subscribe(cb: (v: T) => void): () => void;
}

export function createSignalSafe<T>(initial: T): SignalSafe<T> {
  let current = initial;
  const listeners = new Set<(v: T) => void>();
  return {
    get value(): T {
      return current;
    },
    set value(v: T) {
      current = v;
      for (const cb of listeners) cb(v);
    },
    set(v: T): void {
      current = v;
      for (const cb of listeners) cb(v);
    },
    subscribe(cb: (v: T) => void): () => void {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
  };
}
