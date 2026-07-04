// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview scheduler.yield() utility with feature detection
 * @description Breaks up long tasks by yielding to the main thread.
 *              Uses `scheduler.yield()` where available (Chromium 115+),
 *              falls back to `setTimeout(fn, 50)` for other browsers.
 */

/**
 * Yield to the main thread, allowing the browser to process pending
 * rendering and input events before resuming the current task.
 *
 * Usage:
 * ```ts
 * for (const item of items) {
 *   await schedulerYield(50);
 *   process(item);
 * }
 * ```
 *
 * @param deadlineMs - Fallback deadline in ms (used when scheduler.yield() is
 *                     unavailable). Default 50ms matches a 20fps target.
 * @returns Promise that resolves when the task can resume
 */
export async function schedulerYield(deadlineMs = 50): Promise<void> {
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
