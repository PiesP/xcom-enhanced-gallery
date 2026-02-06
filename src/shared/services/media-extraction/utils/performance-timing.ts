/**
 * @fileoverview Performance timing utilities for extraction operations
 * @description Provides high-resolution timing functions for tracking extraction performance
 */

/**
 * Get high-resolution timestamp in milliseconds
 *
 * @returns Current timestamp in milliseconds
 *
 * @remarks
 * Uses `performance.now()` when available for sub-millisecond precision,
 * falls back to `Date.now()` in environments without Performance API.
 *
 * @example
 * ```typescript
 * const startTime = getTimestamp();
 * await someOperation();
 * const duration = getTimestamp() - startTime;
 * ```
 */
export function getTimestamp(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

/**
 * Calculate elapsed time since start timestamp
 *
 * @param startTime - Start timestamp from getTimestamp()
 * @returns Elapsed time in milliseconds (always non-negative)
 *
 * @remarks
 * Ensures returned value is never negative by using Math.max(0, ...)
 *
 * @example
 * ```typescript
 * const startTime = getTimestamp();
 * await someOperation();
 * const elapsed = getElapsedTime(startTime);
 * console.log(`Operation took ${elapsed}ms`);
 * ```
 */
export function getElapsedTime(startTime: number): number {
  return Math.max(0, getTimestamp() - startTime);
}
