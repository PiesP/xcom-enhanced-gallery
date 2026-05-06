/** @fileoverview Thin wrapper around SolidJS createSignal for use outside component contexts. */

import { createComputed, createRoot, createSignal } from 'solid-js';

export type Signal<T> = ReturnType<typeof createSignal<T>>;

export function createSignalSafe<T>(initial: T): Signal<T> {
  return createSignal<T>(initial);
}

export function effectSafe(fn: () => void): () => void {
  return createRoot((dispose) => {
    createComputed(fn);
    return dispose;
  });
}
