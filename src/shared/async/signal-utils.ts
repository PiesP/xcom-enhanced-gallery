/**
 * @fileoverview Signal utilities for AbortController-based async operations
 * @description Helper functions for working with AbortSignal in modern async patterns
 *
 */

import { globalTimerManager } from '@shared/utils/time/timer-management';

/**
 * Controller for managing a timeout-based AbortSignal
 *
 * @property signal - AbortSignal that will abort after timeout
 * @property cancel - Function to cancel the timeout and prevent signal abortion
 */
export interface TimeoutSignalController {
  /** AbortSignal that will abort after timeout */
  readonly signal: AbortSignal;
  /** Function to cancel the timeout and prevent signal abortion */
  readonly cancel: () => void;
}

/**
 * Create a cancellable timeout signal with manual cleanup control
 *
 * Provides both an AbortSignal that aborts after timeout and a cancel function
 * to clear the timeout early. This is useful when you want to guarantee that
 * the underlying timer is cleared as soon as the caller no longer needs the
 * timeout (e.g. when a raced promise settles).
 *
 * The timer is automatically cleared when the signal aborts to prevent memory leaks.
 *
 * @param ms - Timeout duration in milliseconds
 * @returns Controller object with signal and cancel function
 *
 * @example
 * ```typescript
 * const controller = createTimeoutController(5000);
 * try {
 *   await Promise.race([
 *     fetch(url, { signal: controller.signal }),
 *     otherOperation(),
 *   ]);
 * } finally {
 *   controller.cancel(); // Cleanup timeout if still pending
 * }
 * ```
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
 * The signal will abort with a TimeoutError after the specified duration.
 * The timer is automatically cleaned up when the signal aborts.
 *
 * @param ms - Timeout duration in milliseconds
 * @returns AbortSignal that will abort with TimeoutError after timeout
 *
 * @example
 * ```typescript
 * // Basic usage with fetch
 * const signal = createTimeoutSignal(5000);
 * try {
 *   const response = await fetch(url, { signal });
 * } catch (error) {
 *   if (error.name === 'TimeoutError') {
 *     console.log('Request timed out');
 *   }
 * }
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
 * Creates a unified AbortSignal that aborts when the first input signal aborts,
 * preserving the abort reason from the aborted signal.
 *
 * Uses native `AbortSignal.any()` when available (Chrome 116+, Firefox 124+, Safari 17.4+).
 * Falls back to manual implementation for older browsers (Firefox 119+).
 *
 * Edge cases:
 * - Empty array returns a never-aborting signal
 * - Single signal returns the signal itself (no wrapper)
 * - Already-aborted signals cause immediate abortion
 * - Invalid signals (null/undefined) are filtered out
 *
 * @param signals - Array of AbortSignals to combine (invalid values filtered)
 * @returns Combined AbortSignal that aborts when any input aborts
 *
 * @example
 * ```typescript
 * // Combine user cancellation with timeout
 * const userController = new AbortController();
 * const timeoutSignal = createTimeoutSignal(5000);
 * const combinedSignal = combineSignals([userController.signal, timeoutSignal]);
 *
 * try {
 *   await fetch(url, { signal: combinedSignal });
 * } catch (error) {
 *   if (isAbortError(error)) {
 *     // Aborted by either user or timeout
 *   }
 * }
 * ```
 */
export function combineSignals(signals: AbortSignal[]): AbortSignal {
  // Filter out any runtime-invalid values (tests may pass null/undefined)
  const validSignals = signals.filter((s): s is AbortSignal => !!s);

  if (validSignals.length === 0) {
    return new AbortController().signal; // Never-aborting signal
  }

  if (validSignals.length === 1) {
    return validSignals[0]!;
  }

  // Use native AbortSignal.any() (Chrome 116+, Firefox 124+, Safari 17.4+).
  // Well-supported as of 2026; no fallback needed.
  return AbortSignal.any(validSignals);
}
