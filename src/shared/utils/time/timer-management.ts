/**
 * @fileoverview Timer management utility
 * @description Provides centralized timer tracking and management for consistent
 *              resource cleanup across the application. Phase C: Consistent timer
 *              and resource management. setInterval/clearInterval removed as unused
 *              in production code.
 * @version 2.1.0
 */

/**
 * Timer ID type representing a browser setTimeout identifier.
 * In the browser environment, `window.setTimeout()` returns a number.
 * We explicitly use `number` for browser-only code.
 *
 * @typedef {number} TimerId
 */
type TimerId = number;

/**
 * Timer manager for centralized timeout tracking and cleanup.
 *
 * Provides a utility to register all `setTimeout` timers and clean them up
 * in batch. This ensures proper resource cleanup and prevents timer leaks
 * when components or services are destroyed.
 *
 * **Note**: `setInterval` support was removed as it was unused in production code.
 *
 * @class TimerManager
 * @example
 * const manager = new TimerManager();
 * const timerId = manager.setTimeout(() => console.log('done'), 1000);
 * manager.cleanup(); // Clears all timers
 */
class TimerManager {
  private readonly timers = new Set<TimerId>();

  /**
   * Register and track a setTimeout callback.
   *
   * Creates a timeout via `window.setTimeout()` and automatically tracks it.
   * When the callback executes, the timer is automatically removed from tracking.
   * This pattern prevents tracking leaks if callbacks are never called.
   *
   * @param {() => void} callback - Function to execute when timeout completes.
   * @param {number} delay - Delay in milliseconds before callback executes.
   * @returns {TimerId} The timer ID for later cancellation via `clearTimeout()`.
   *
   * @example
   * const timerId = manager.setTimeout(() => {
   *   console.log('Executed after 1 second');
   * }, 1000);
   */
  setTimeout(callback: () => void, delay: number): TimerId {
    let id: TimerId;
    id = window.setTimeout(() => {
      try {
        callback();
      } finally {
        this.timers.delete(id);
      }
    }, delay);

    this.timers.add(id);
    return id;
  }

  /**
   * Remove and cancel a registered setTimeout.
   *
   * Cancels a previously registered timeout if it exists and has not yet executed.
   * Safe to call with non-existent IDs (silently ignored).
   *
   * @param {TimerId} id - The timer ID returned from `setTimeout()`.
   * @returns {void}
   *
   * @example
   * const timerId = manager.setTimeout(() => { }, 1000);
   * manager.clearTimeout(timerId); // Timer cancelled before execution
   */
  clearTimeout(id: TimerId): void {
    if (this.timers.has(id)) {
      window.clearTimeout(id);
      this.timers.delete(id);
    }
  }

  /**
   * Cancel and remove all active timers.
   *
   * Clears all registered timers in a single operation. Useful during cleanup
   * phases (e.g., component unmount, service destruction) to prevent dangling
   * timers and memory leaks.
   *
   * @returns {void}
   *
   * @example
   * // During cleanup/teardown
   * onCleanup(() => {
   *   manager.cleanup();
   * });
   */
  cleanup(): void {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers.clear();
  }

  /**
   * Get the count of currently active timers.
   *
   * Returns the number of timers still pending execution. Useful for debugging
   * and monitoring timer resource usage.
   *
   * @returns {number} Count of active timers in the manager.
   *
   * @example
   * console.log(`Active timers: ${manager.getActiveTimersCount()}`);
   */
  getActiveTimersCount(): number {
    return this.timers.size;
  }
}

/**
 * Global timer manager instance.
 *
 * Singleton instance of `TimerManager` exported for use throughout the application.
 * This instance should be used by all application code that needs to create timers
 * to ensure centralized tracking and cleanup.
 *
 * @type {TimerManager}
 * @example
 * import { globalTimerManager } from '@shared/utils/time/timer-management';
 * const timerId = globalTimerManager.setTimeout(() => { }, 1000);
 */
export const globalTimerManager = new TimerManager();
