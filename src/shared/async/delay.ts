/**
 * @fileoverview Delay and timeout utilities with AbortSignal support
 * @description Modern async delay/timeout primitives replacing setTimeout-based patterns
 *
 * @version 1.1.0
 */

import { combineSignals, createTimeoutController } from '@shared/async/signal-utils';
import { getAbortReasonOrAbortErrorFromSignal, isAbortError } from '@shared/error/cancellation';
import { globalTimerManager } from '@shared/utils/time/timer-management';

/**
 * Error thrown when an operation times out
 */
class TimeoutError extends Error {
  override readonly name = 'TimeoutError';

  constructor(message = 'Operation timed out') {
    super(message);
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Options for timeout operations
 */
interface TimeoutOptions {
  /** Timeout duration in milliseconds */
  readonly ms: number;
  /** Optional external signal for additional cancellation */
  readonly signal?: AbortSignal;
  /** Custom error message for timeout */
  readonly message?: string;
}

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
    const timerId = globalTimerManager.setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = (): void => {
      cleanup();
      reject(getAbortReasonOrAbortErrorFromSignal(signal));
    };

    const cleanup = (): void => {
      globalTimerManager.clearTimeout(timerId);
      signal?.removeEventListener('abort', onAbort);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Wrap a promise with a timeout
 *
 * If the promise doesn't resolve/reject within the timeout,
 * a TimeoutError is thrown. The original promise continues
 * running in the background (cannot be truly cancelled).
 *
 * For operations that support AbortSignal, prefer passing
 * a timeout signal directly to the operation instead.
 *
 * @param promise - Promise to wrap
 * @param options - Timeout options (ms, signal, message)
 * @returns Promise that resolves/rejects within timeout
 * @throws TimeoutError if operation times out
 *
 * @example
 * ```typescript
 * // Basic timeout
 * const result = await timeout(fetchData(), { ms: 5000 });
 *
 * // With external cancellation
 * const controller = new AbortController();
 * const result = await timeout(fetchData(), {
 *   ms: 5000,
 *   signal: controller.signal,
 *   message: 'Data fetch timed out',
 * });
 * ```
 */
async function timeout<T>(promise: Promise<T>, options: TimeoutOptions): Promise<T> {
  const { ms, signal, message } = options;

  // If already aborted, reject immediately
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException('Operation was aborted', 'AbortError');
  }

  // Create cancellable timeout signal so we can always clear the underlying timer
  // when the wrapped promise settles (prevents lingering timers under heavy usage).
  const timeoutController = createTimeoutController(ms);
  const timeoutSignal = timeoutController.signal;

  // Combine with external signal if provided
  const combinedSignal = signal ? combineSignals([signal, timeoutSignal]) : timeoutSignal;

  // Race between promise and timeout
  return new Promise<T>((resolve, reject) => {
    let settled = false;

    function cleanup(): void {
      timeoutController.cancel();
      try {
        combinedSignal.removeEventListener('abort', onAbort);
      } catch {
        // Ignore listener cleanup failures (defensive)
      }
    }

    function onAbort(): void {
      if (settled) return;
      settled = true;

      cleanup();

      const reason = combinedSignal.reason;
      // Only treat DOMException TimeoutError as a timeout.
      // External callers may abort with an Error named TimeoutError as a deliberate reason,
      // and that should be preserved rather than being normalized into our TimeoutError class.
      if (reason instanceof DOMException && reason.name === 'TimeoutError') {
        reject(new TimeoutError(message ?? 'Operation timed out'));
      } else {
        reject(reason ?? new DOMException('Operation was aborted', 'AbortError'));
      }
    }

    // Check if already aborted (race condition prevention)
    if (combinedSignal.aborted) {
      onAbort();
      return;
    }

    combinedSignal.addEventListener('abort', onAbort, { once: true });

    promise
      .then((value) => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve(value);
        }
      })
      .catch((error) => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(error);
        }
      });
  });
}

/**
 * Re-export isAbortError for convenience
 */
export { isAbortError };
