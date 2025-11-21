/**
 * @fileoverview Performance Utilities - Phase 5 Bundle Optimization
 * @version 1.0.0
 *
 * Performance-related utilities separated into independent modules
 * Separated into independent modules for tree-shaking optimization
 */

/**
 * Debouncer class - prevents duplicate execution
 * @template T - Function parameter type
 * @description Prevents duplicate execution during specified delay period, executes only the last call
 * @example
 * ```typescript
 * const debouncer = new Debouncer(() => autoSave(), 1000);
 * input.addEventListener('input', () => debouncer.execute());
 * debouncer.flush(); // Execute immediately
 * ```
 */
export class Debouncer<T extends unknown[] = unknown[]> {
  private timerId: number | null = null;
  private lastArgs: T | null = null;

  /**
   * @param fn - Function to execute
   * @param delay - Delay time in milliseconds
   */
  constructor(
    private readonly fn: (...args: T) => void,
    private readonly delay: number
  ) {}

  /**
   * Schedule function execution
   * @param args - Arguments to pass to the function
   */
  execute(...args: T): void {
    this.lastArgs = args;
    this.clearTimer();
    this.timerId = Number(
      globalThis.setTimeout(() => {
        if (this.lastArgs) {
          this.fn(...this.lastArgs);
          this.lastArgs = null;
        }
      }, this.delay)
    );
  }

  /**
   * Execute pending function immediately
   */
  flush(): void {
    if (this.lastArgs) {
      this.clearTimer();
      this.fn(...this.lastArgs);
      this.lastArgs = null;
    }
  }

  /**
   * Cancel pending function execution
   */
  cancel(): void {
    this.clearTimer();
    this.lastArgs = null;
  }

  /**
   * Check if there is a pending function
   * @returns true if pending
   */
  isPending(): boolean {
    return this.timerId !== null;
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      globalThis.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

/**
 * Debouncer factory function
 * @template T - Function parameter type
 * @param fn - Function to debounce
 * @param delay - Delay time in milliseconds
 * @returns Debouncer instance
 * @example
 * ```typescript
 * const debouncer = createDebouncer(() => console.log('done'), 500);
 * debouncer.execute();
 * ```
 */
export function createDebouncer<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): Debouncer<T> {
  return new Debouncer(fn, delay);
}

/**
 * RAF-based throttle for performance optimization
 * @template T - Function type
 * @param fn - Function to throttle
 * @param options - Throttle options (leading, trailing)
 * @returns Throttled function
 * @description High-performance throttle using requestAnimationFrame
 * @example
 * ```typescript
 * const handleScroll = rafThrottle(() => {
 *   console.log('scrolling...');
 * }, { leading: true, trailing: true });
 * window.addEventListener('scroll', handleScroll);
 * ```
 */
export function rafThrottle<T extends (...args: unknown[]) => void>(
  fn: T,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  const { leading = true, trailing = true } = options;
  let isThrottled = false;
  let pendingArgs: Parameters<T> | null = null;

  function throttled(...args: Parameters<T>): void {
    pendingArgs = args;

    if (!isThrottled) {
      if (leading) {
        try {
          fn(...args);
        } catch {
          // Swallow errors to avoid secondary failures during throttled invocations.
        }
      }

      isThrottled = true;
      requestAnimationFrame(() => {
        isThrottled = false;
        if (trailing && pendingArgs) {
          try {
            fn(...pendingArgs);
          } catch {
            // Trailing invocation errors are intentionally ignored here.
          }
        }
        pendingArgs = null;
      });
    }
  }

  return throttled as T;
}

/**
 * Scroll-specific throttle
 * @template T - Function type
 * @param func - Function to throttle
 * @returns Throttled function
 * @description RAF throttle with both leading and trailing enabled
 */
export function throttleScroll<T extends (...args: unknown[]) => void>(func: T): T {
  return rafThrottle(func, { leading: true, trailing: true });
}
