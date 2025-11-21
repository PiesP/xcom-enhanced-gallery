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
