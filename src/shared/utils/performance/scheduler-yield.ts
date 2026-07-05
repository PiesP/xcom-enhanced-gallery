// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview scheduler.yield() utility with feature detection
 * @description Breaks up long tasks by yielding to the main thread.
 *              Uses `scheduler.yield()` where available (Chromium 115+),
 *              falls back to `setTimeout(fn, 50)` for other browsers.
 */

import { SCHEDULER_YIELD_DEADLINE_MS } from '@constants/performance';

/**
 * Yield to the main thread, allowing the browser to process pending
 * rendering and input events before resuming the current task.
 *
 * Usage:
 * ```ts
 * for (const item of items) {
 *   await schedulerYield();
 *   process(item);
 * }
 * ```
 *
 * @param deadlineMs - Fallback deadline in ms (used when scheduler.yield() is
 *                     unavailable). Default matches {@linkcode SCHEDULER_YIELD_DEADLINE_MS}.
 * @returns Promise that resolves when the task can resume
 */
export async function schedulerYield(deadlineMs = SCHEDULER_YIELD_DEADLINE_MS): Promise<void> {
  if (
    typeof window !== 'undefined' &&
    'scheduler' in window &&
    typeof (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler.yield ===
      'function'
  ) {
    return (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, deadlineMs));
}
