/**
 * @fileoverview Debounce utility for async operations
 * @description Simple debounce implementation for settings persistence
 *
 * @example
 * ```typescript
 * const debouncedSave = createDebounced((value: number) => {
 *   void setTypedSetting('gallery.volume', value);
 * }, 300);
 *
 * debouncedSave(0.5); // Delayed execution
 * debouncedSave(0.7); // Cancels previous, restarts timer
 * ```
 */

/**
 * Debounced function interface with cancel and flush capabilities
 *
 * @template Args - Tuple type representing function arguments
 */
import { globalTimerManager } from '@shared/utils/time/timer-management';

interface DebouncedFunction<Args extends unknown[]> {
  /** Call the debounced function */
  (...args: Args): void;
  /** Cancel pending execution */
  cancel(): void;
  /** Flush pending execution immediately */
  flush(): void;
}

/**
 * Create a debounced version of a function
 *
 * @template Args - Tuple type representing function arguments
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds (default: 300ms)
 * @returns Debounced function with cancel/flush methods
 */
export function createDebounced<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs = 300
): DebouncedFunction<Args> {
  let timeoutId: number | null = null;
  let pendingArgs: Args | null = null;

  const cancel = (): void => {
    if (timeoutId !== null) {
      globalTimerManager.clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
  };

  const flush = (): void => {
    if (timeoutId !== null && pendingArgs !== null) {
      globalTimerManager.clearTimeout(timeoutId);
      timeoutId = null;
      const args = pendingArgs;
      pendingArgs = null;
      fn(...args);
    }
  };

  const debounced = ((...args: Args): void => {
    cancel();
    pendingArgs = args;
    timeoutId = globalTimerManager.setTimeout(() => {
      timeoutId = null;
      const savedArgs = pendingArgs;
      pendingArgs = null;
      if (savedArgs !== null) {
        fn(...savedArgs);
      }
    }, delayMs);
  }) as DebouncedFunction<Args>;

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}
