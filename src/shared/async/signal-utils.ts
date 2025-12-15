/**
 * @fileoverview Signal utilities for AbortController-based async operations
 * @description Helper functions for working with AbortSignal in modern async patterns
 *
 * @version 1.0.0
 */

import { globalTimerManager } from '@shared/utils/time/timer-management';

/**
 * Create an AbortSignal that times out after specified milliseconds
 *
 * Always uses our manual implementation for consistency with fake timers in tests.
 * The native `AbortSignal.timeout()` uses internal browser timers that can't
 * be controlled by vitest's fake timers.
 *
 * @param ms - Timeout duration in milliseconds
 * @returns AbortSignal that will abort after timeout
 *
 * @example
 * ```typescript
 * const signal = createTimeoutSignal(5000);
 * await fetch(url, { signal });
 * ```
 */
export function createTimeoutSignal(ms: number): AbortSignal {
  // Always use manual implementation for testability with fake timers
  // Native AbortSignal.timeout() uses internal browser timers that bypass vi.useFakeTimers()
  const controller = new AbortController();
  const timeoutId = globalTimerManager.setTimeout(() => {
    controller.abort(new DOMException('The operation timed out.', 'TimeoutError'));
  }, ms);

  // Clean up timeout if signal is aborted externally
  controller.signal.addEventListener(
    'abort',
    () => {
      globalTimerManager.clearTimeout(timeoutId);
    },
    { once: true }
  );

  return controller.signal;
}

/**
 * Combine multiple AbortSignals into a single signal that aborts when any input aborts
 *
 * Uses native `AbortSignal.any()` (Chrome 116+, Firefox 124+, Safari 17.4+).
 * All target browsers support this API natively.
 *
 * @param signals - Array of AbortSignals to combine
 * @returns Combined AbortSignal
 *
 * @example
 * ```typescript
 * const userController = new AbortController();
 * const timeoutSignal = createTimeoutSignal(5000);
 * const combinedSignal = combineSignals([userController.signal, timeoutSignal]);
 * await fetch(url, { signal: combinedSignal });
 * ```
 */
export function combineSignals(signals: AbortSignal[]): AbortSignal {
  // Accept runtime-invalid values defensively (tests may pass null/undefined)
  const validSignals = signals.filter((s): s is AbortSignal => Boolean(s));

  if (validSignals.length === 0) {
    return new AbortController().signal; // Never-aborting signal
  }

  if (validSignals.length === 1) {
    return validSignals[0]!;
  }

  // Prefer native AbortSignal.any when available.
  // Note: Some test environments deliberately patch AbortSignal.any to undefined.
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any(validSignals);
  }

  // Manual fallback: create a signal that aborts when any input aborts.
  const controller = new AbortController();
  let settled = false;

  function cleanup(): void {
    for (const s of validSignals) {
      try {
        s.removeEventListener('abort', onAbort);
      } catch {
        // Ignore listener cleanup failures (defensive)
      }
    }
  }

  function onAbort(): void {
    if (settled) return;
    settled = true;

    // Preserve abort reason if an input signal is actually aborted.
    // In some defensive test scenarios, the abort handler can be invoked
    // without a corresponding aborted signal.
    const abortedSignal = validSignals.find((s) => s.aborted);
    const reason = abortedSignal?.reason;

    // When reason is undefined, platforms typically supply a default AbortError.
    controller.abort(reason);
    cleanup();
  }

  // If any signal is already aborted, abort immediately without registering listeners.
  for (const s of validSignals) {
    if (s.aborted) {
      controller.abort(s.reason);
      return controller.signal;
    }
  }

  for (const s of validSignals) {
    s.addEventListener('abort', onAbort, { once: true });
  }

  return controller.signal;
}

/**
 * Check if an error is an AbortError
 *
 * Useful for distinguishing user cancellation from actual errors.
 *
 * @param error - Error to check
 * @returns True if the error is an AbortError
 *
 * @example
 * ```typescript
 * try {
 *   await fetch(url, { signal });
 * } catch (error) {
 *   if (isAbortError(error)) {
 *     console.log('Request was cancelled');
 *     return;
 *   }
 *   throw error;
 * }
 * ```
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'AbortError' || error.name === 'TimeoutError';
  }
  if (error instanceof Error) {
    return error.name === 'AbortError' || error.message.includes('aborted');
  }
  return false;
}
