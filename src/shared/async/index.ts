/**
 * @fileoverview Modern Async Utilities Module
 * @description AbortSignal-based async primitives replacing globalTimerManager
 *
 * **Key Features**:
 * - `AbortSignal.timeout()` for native timeout support
 * - `delay()` with AbortSignal cancellation
 * - `timeout()` wrapper for promise timeout
 * - `withRetry()` with exponential backoff
 * - `race()` utility for first-settled semantics
 *
 * **Migration from globalTimerManager**:
 * - No manual timer ID tracking required
 * - Automatic cleanup via AbortController
 * - Native browser API integration
 * - Better TypeScript type inference
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

export { delay, timeout, TimeoutError, type TimeoutOptions } from './delay';

export { type RetryOptions, type RetryResult, withRetry } from './retry';

export { combineSignals, createTimeoutSignal, isAbortError } from './signal-utils';
