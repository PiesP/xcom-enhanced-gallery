/**
 * @fileoverview Signal utilities for AbortController-based async operations
 * @description Helper functions for working with AbortSignal in modern async patterns
 *
 * @version 1.0.0
 */

import { globalTimerManager } from '@shared/utils/time/timer-management';

interface TimeoutSignalController {
  readonly signal: AbortSignal;
  readonly cancel: () => void;
}

/**
 * Create a cancellable timeout signal.
 *
 * This is useful when you want to guarantee that the underlying timer is cleared
 * as soon as the caller no longer needs the timeout (e.g. when a raced promise settles).
 */
export function createTimeoutController(ms: number): TimeoutSignalController {
  const controller = new AbortController();

  // Important: declare before assignment to avoid TDZ when tests force timers
  // to execute synchronously during the initialization expression.
  let timeoutId: number | null = null;
  timeoutId = globalTimerManager.setTimeout(() => {
    controller.abort(new DOMException('The operation timed out.', 'TimeoutError'));
  }, ms);

  const clear = (): void => {
    if (timeoutId === null) return;
    globalTimerManager.clearTimeout(timeoutId);
    timeoutId = null;
  };

  // Ensure the timer is cleared if/when the signal aborts.
  controller.signal.addEventListener(
    'abort',
    () => {
      clear();
    },
    { once: true }
  );

  return {
    signal: controller.signal,
    cancel: clear,
  };
}

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
  // Always use manual implementation for testability with fake timers.
  // Native AbortSignal.timeout() uses internal browser timers that bypass vi.useFakeTimers().
  return createTimeoutController(ms).signal;
}

/**
 * Combine multiple AbortSignals into a single signal that aborts when any input aborts
 *
 * Uses native `AbortSignal.any()` when available (Chrome 116+, Firefox 124+, Safari 17.4+).
 * Some of our targets (e.g. Firefox 119+) do not guarantee this API, so we keep a manual fallback.
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
  const validSignals = signals.filter((s): s is AbortSignal => !!s);

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
// isAbortError is re-exported from @shared/error/cancellation.
