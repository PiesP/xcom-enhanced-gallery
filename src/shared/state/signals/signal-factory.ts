/** @fileoverview Thin wrapper around SolidJS signals and effects for use outside component contexts. */

import { createComputed, createRoot } from 'solid-js';

export function effectSafe(fn: () => void): () => void {
  return createRoot((dispose) => {
    createComputed(fn);
    return dispose;
  });
}
