/**
 * @fileoverview Signal utilities for AbortController-based async operations
 * @description Helper functions for working with AbortSignal in modern async patterns
 *
 * @version 1.0.0
 */

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
  const timeoutId = window.setTimeout(() => {
    controller.abort(new DOMException('The operation timed out.', 'TimeoutError'));
  }, ms);

  // Clean up timeout if signal is aborted externally
  controller.signal.addEventListener(
    'abort',
    () => {
      window.clearTimeout(timeoutId);
    },
    { once: true },
  );

  return controller.signal;
}

/**
 * Combine multiple AbortSignals into a single signal that aborts when any input aborts
 *
 * Uses native `AbortSignal.any()` when available (Chrome 116+, Firefox 124+),
 * falls back to manual implementation for older environments.
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
  // Filter out undefined/null signals
  const validSignals = signals.filter(Boolean);

  if (validSignals.length === 0) {
    return new AbortController().signal; // Never-aborting signal
  }

  if (validSignals.length === 1) {
    return validSignals[0]!;
  }

  // Use native AbortSignal.any() if available (Chrome 116+, Firefox 124+)
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any(validSignals);
  }

  // Fallback for older browsers
  const controller = new AbortController();

  const onAbort = (): void => {
    const abortedSignal = validSignals.find((s) => s.aborted);
    controller.abort(abortedSignal?.reason);
    cleanup();
  };

  const cleanup = (): void => {
    for (const signal of validSignals) {
      signal.removeEventListener('abort', onAbort);
    }
  };

  // Check if any signal is already aborted
  const alreadyAborted = validSignals.find((s) => s.aborted);
  if (alreadyAborted) {
    controller.abort(alreadyAborted.reason);
    return controller.signal;
  }

  // Listen for abort on all signals
  for (const signal of validSignals) {
    signal.addEventListener('abort', onAbort, { once: true });
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
