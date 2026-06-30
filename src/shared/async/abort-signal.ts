// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview AbortSignal utilities — polyfill for AbortSignal.any()
 * (unavailable in Safari 17.0–17.3).
 */

/**
 * Polyfill for AbortSignal.any() — combines multiple AbortSignals into one.
 * If any input signal aborts, the returned signal aborts too.
 *
 * Returns both the merged signal and a cleanup function. Call cleanup()
 * after the operation using the merged signal finishes (success or error)
 * to remove the abort listeners from the input signals. This prevents
 * listener accumulation on long-lived signals.
 *
 * @param signals - One or more AbortSignals to merge
 * @returns An object with the merged signal and a cleanup function
 */
export function mergeAbortSignals(...signals: AbortSignal[]): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const listeners: Array<{ signal: AbortSignal; handler: () => void }> = [];

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    const handler = () => controller.abort();
    signal.addEventListener('abort', handler, { once: true });
    listeners.push({ signal, handler });
  }

  const cleanup = () => {
    for (const { signal, handler } of listeners) {
      signal.removeEventListener('abort', handler);
    }
    listeners.length = 0;
  };

  return { signal: controller.signal, cleanup };
}
