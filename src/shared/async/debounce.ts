// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Debounce utility for async operations
 * @description Simple debounce implementation for settings persistence
 *
 * @example
 * ```typescript
 * const debouncedSave = createDebounced((value: number) => {
 *   void setTypedSetting('gallery.volume', value);
 * }, 300);
 *
 * debouncedSave(0.5); // Delayed execution
 * debouncedSave(0.7); // Cancels previous, restarts timer
 * ```
 */

import { DEFAULT_DEBOUNCE_MS } from '@constants/performance';

/**
 * Debounced function interface with cancel and flush capabilities
 *
 * @template Args - Tuple type representing function arguments
 */
export interface DebouncedFunction<Args extends unknown[]> {
  /** Call the debounced function */
  (...args: Args): void;
  /** Cancel pending execution */
  cancel(): void;
  /** Flush pending execution immediately */
  flush(): void;
}

/**
 * Create a debounced version of a function
 *
 * @template Args - Tuple type representing function arguments
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds (default: DEFAULT_DEBOUNCE_MS)
 * @returns Debounced function with cancel/flush methods
 */
export function createDebounced<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number = DEFAULT_DEBOUNCE_MS
): DebouncedFunction<Args> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Args | null = null;

  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
  };

  const flush = (): void => {
    if (timeoutId !== null && pendingArgs !== null) {
      clearTimeout(timeoutId);
      const args = pendingArgs;
      timeoutId = null;
      pendingArgs = null;
      fn(...args);
    }
  };

  const debounced = ((...args: Args): void => {
    cancel();
    pendingArgs = args;
    timeoutId = setTimeout(() => {
      const savedArgs = pendingArgs;
      timeoutId = null;
      pendingArgs = null;
      if (savedArgs !== null) {
        fn(...savedArgs);
      }
    }, delayMs);
  }) as DebouncedFunction<Args>;

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}
