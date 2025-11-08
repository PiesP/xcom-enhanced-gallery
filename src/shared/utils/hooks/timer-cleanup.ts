/**
 * @fileoverview Timer Cleanup Utilities
 * @description Phase 350: Common timer management utilities
 *
 * Wraps globalTimerManager to provide automatic cleanup features.
 *
 * @module shared/utils/hooks/timer-cleanup
 */

import { globalTimerManager } from '@shared/utils/timer-management';
import { logger } from '@shared/logging';

/**
 * Managed Timer interface
 */
export interface ManagedTimer {
  /** Timer ID */
  id: number | null;
  /** Cancel timer */
  cancel: () => void;
  /** Check if active */
  isActive: () => boolean;
}

/**
 * Managed setTimeout
 *
 * @example
 * ```typescript
 * const timer = createManagedTimeout(() => {
 *   console.log('Delayed action');
 * }, 1000);
 *
 * // Cancel
 * timer.cancel();
 * ```
 */
export function createManagedTimeout(callback: () => void, delay: number): ManagedTimer {
  let timerId: number | null = globalTimerManager.setTimeout(callback, delay);

  return {
    id: timerId,
    cancel: () => {
      if (timerId !== null) {
        globalTimerManager.clearTimeout(timerId);
        timerId = null;
      }
    },
    isActive: () => timerId !== null,
  };
}

/**
 * Managed setInterval
 *
 * @example
 * ```typescript
 * const timer = createManagedInterval(() => {
 *   console.log('Repeated action');
 * }, 1000);
 *
 * // Cancel
 * timer.cancel();
 * ```
 */
export function createManagedInterval(callback: () => void, interval: number): ManagedTimer {
  let timerId: number | null = globalTimerManager.setInterval(callback, interval);

  return {
    id: timerId,
    cancel: () => {
      if (timerId !== null) {
        globalTimerManager.clearInterval(timerId);
        timerId = null;
      }
    },
    isActive: () => timerId !== null,
  };
}

/**
 * Timer Group Manager
 *
 * Manages multiple timers with one lifecycle.
 *
 * @example
 * ```typescript
 * const group = createTimerGroup();
 *
 * group.setTimeout(() => console.log('A'), 1000);
 * group.setTimeout(() => console.log('B'), 2000);
 * group.setInterval(() => console.log('C'), 500);
 *
 * // Bulk cancel
 * group.cancelAll();
 * ```
 */
export function createTimerGroup() {
  const timers: ManagedTimer[] = [];

  return {
    setTimeout: (callback: () => void, delay: number): ManagedTimer => {
      const timer = createManagedTimeout(callback, delay);
      timers.push(timer);
      return timer;
    },
    setInterval: (callback: () => void, interval: number): ManagedTimer => {
      const timer = createManagedInterval(callback, interval);
      timers.push(timer);
      return timer;
    },
    cancelAll: () => {
      timers.forEach(timer => timer.cancel());
      timers.length = 0;
    },
    getActiveCount: () => {
      return timers.filter(timer => timer.isActive()).length;
    },
  };
}

/**
 * Debounced Function with Cleanup
 *
 * Debounce helper using globalTimerManager
 *
 * @example
 * ```typescript
 * const debouncedFn = createDebouncedFunction(
 *   () => console.log('Debounced!'),
 *   300
 * );
 *
 * debouncedFn(); // Executes after 300ms
 * debouncedFn(); // Cancels previous timer, starts new 300ms
 *
 * // cleanup
 * debouncedFn.cancel();
 * ```
 */
export function createDebouncedFunction<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timerId: number | null = null;

  const debounced = ((...args: unknown[]) => {
    if (timerId !== null) {
      globalTimerManager.clearTimeout(timerId);
    }
    timerId = globalTimerManager.setTimeout(() => {
      timerId = null;
      fn(...args);
    }, delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timerId !== null) {
      globalTimerManager.clearTimeout(timerId);
      timerId = null;
    }
  };

  return debounced;
}

/**
 * Async Retry with Exponential Backoff
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('Failed');
 *     return response.json();
 *   },
 *   { maxRetries: 3, initialDelay: 100 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 100, maxDelay = 5000, backoffFactor = 2 } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        logger.debug(`[RetryWithBackoff] Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
        await new Promise<void>(resolve => {
          globalTimerManager.setTimeout(() => resolve(), delay);
        });
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }
  }

  throw lastError || new Error('Retry failed');
}
