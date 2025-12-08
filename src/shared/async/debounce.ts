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

// deno-lint-ignore no-explicit-any
type AnyFunction = (...args: any[]) => void;

/**
 * Debounced function interface
 */
export interface DebouncedFunction<T extends AnyFunction> {
  /** Call the debounced function */
  (...args: Parameters<T>): void;
  /** Cancel pending execution */
  cancel(): void;
  /** Flush pending execution immediately */
  flush(): void;
}

/**
 * Create a debounced version of a function
 *
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds (default: 300ms)
 * @returns Debounced function with cancel/flush methods
 */
export function createDebounced<T extends AnyFunction>(
  fn: T,
  delayMs = 300,
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
  };

  const flush = (): void => {
    if (timeoutId !== null && pendingArgs !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      const args = pendingArgs;
      pendingArgs = null;
      fn(...args);
    }
  };

  const debounced = ((...args: Parameters<T>): void => {
    cancel();
    pendingArgs = args;
    timeoutId = setTimeout(() => {
      timeoutId = null;
      const savedArgs = pendingArgs;
      pendingArgs = null;
      if (savedArgs !== null) {
        fn(...savedArgs);
      }
    }, delayMs);
  }) as DebouncedFunction<T>;

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}
