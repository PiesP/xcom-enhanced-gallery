/**
 * @fileoverview Modern Async Utilities Module
 * @description AbortSignal-based async primitives
 *
 * **Key Features**:
 * - `delay()` with AbortSignal cancellation
 * - `timeout()` wrapper for promise timeout
 * - `withRetry()` with exponential backoff
 * - `race()` utility for first-settled semantics
 *
 * **Timeout signals in tests**:
 * - `createTimeoutSignal()` intentionally uses `globalTimerManager` so vitest fake timers can
 *   reliably control timeouts (native `AbortSignal.timeout()` uses internal timers).
 *
 * @example
 * ```typescript
 * import { delay, timeout, withRetry } from '@shared/async';
 *
 * // Cancellable delay
 * const controller = new AbortController();
 * await delay(1000, controller.signal);
 *
 * // Timeout wrapper
 * const result = await timeout(fetchData(), 5000);
 *
 * // Retry with exponential backoff
 * const data = await withRetry(() => fetchData(), {
 *   maxAttempts: 3,
 *   baseDelayMs: 200,
 *   signal: controller.signal,
 * });
 * ```
 *
 * @version 1.0.0
 */

export { createDebounced, type DebouncedFunction } from './debounce';
export { delay, TimeoutError, type TimeoutOptions, timeout } from './delay';
export { type RetryOptions, type RetryResult, withRetry } from './retry';
export { combineSignals, createTimeoutSignal, isAbortError } from './signal-utils';
