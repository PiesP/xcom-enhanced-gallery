// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Shared timeout management utility for Solid.js hooks.
 *
 * Provides a createTimeout() helper that returns `{ set, clear }` with
 * automatic cleanup via onCleanup. Eliminates duplicated timer patterns
 * across multiple hooks.
 */

import { onCleanup } from 'solid-js';

export interface TimeoutHandle {
  readonly set: (callback: () => void, delay: number) => void;
  readonly clear: () => void;
}

/**
 * Creates a managed timeout handle with automatic cleanup.
 *
 * @returns A TimeoutHandle with `set` and `clear` methods.
 *          The timeout is automatically cleared on cleanup.
 *
 * @example
 * const timer = createTimeout();
 * timer.set(() => setIsVisible(false), 3000);
 * // Later, to cancel:
 * timer.clear();
 */
export function createTimeout(): TimeoutHandle {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const clear = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const set = (callback: () => void, delay: number): void => {
    clear();
    timerId = setTimeout(() => {
      timerId = null;
      callback();
    }, delay);
  };

  onCleanup(clear);

  return { set, clear };
}
