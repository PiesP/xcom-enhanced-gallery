// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Delay utility with AbortSignal support
 * @description Modern async delay primitive replacing setTimeout-based patterns
 */

import { getAbortReasonOrAbortErrorFromSignal } from '@shared/error/cancellation';

/**
 * Create a promise that resolves after a delay
 *
 * Supports cancellation via AbortSignal - when signal is aborted,
 * the promise rejects immediately.
 *
 * @param ms - Delay duration in milliseconds
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise that resolves after delay or rejects on abort
 *
 * @example
 * ```typescript
 * import { isAbortError } from '@shared/error/cancellation';
 *
 * // Simple delay
 * await delay(1000);
 *
 * // Cancellable delay
 * const controller = new AbortController();
 * try {
 *   await delay(5000, controller.signal);
 * } catch (error) {
 *   if (isAbortError(error)) {
 *     console.log('Delay was cancelled');
 *   }
 * }
 *
 * // Cancel from elsewhere
 * controller.abort();
 * ```
 */
export async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  // Fast path for non-positive delays
  if (ms <= 0) return;

  // If already aborted, reject immediately
  if (signal?.aborted) {
    throw getAbortReasonOrAbortErrorFromSignal(signal);
  }

  return new Promise<void>((resolve, reject) => {
    const timerId = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = (): void => {
      cleanup();
      reject(getAbortReasonOrAbortErrorFromSignal(signal));
    };

    const cleanup = (): void => {
      clearTimeout(timerId);
      signal?.removeEventListener('abort', onAbort);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
