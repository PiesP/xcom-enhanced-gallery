/**
 * Centralized timer tracking and cleanup utility.
 * Prevents timer leaks and ensures proper resource management.
 */

/** Timer ID representing a browser setTimeout identifier. */
type TimerId = number;

/** Centralized timeout tracking and cleanup utility. */
class TimerManager {
  private readonly timers = new Set<TimerId>();

  /**
   * Register and track a setTimeout callback.
   * Automatically removes the timer from tracking after execution.
   *
   * @param callback - Function to execute when timeout completes.
   * @param delay - Delay in milliseconds.
   * @returns The timer ID for later cancellation.
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
   * Cancel a registered setTimeout if it exists.
   * Safe to call with non-existent IDs.
   *
   * @param id - The timer ID returned from setTimeout().
   */
  clearTimeout(id: TimerId): void {
    if (this.timers.has(id)) {
      window.clearTimeout(id);
      this.timers.delete(id);
    }
  }

  /**
   * Cancel and remove all active timers.
   * Useful during cleanup phases to prevent dangling timers.
   */
  cleanup(): void {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers.clear();
  }

  /**
   * Get the count of currently active timers.
   * Useful for debugging and monitoring timer resource usage.
   *
   * @returns Count of active timers.
   */
  getActiveTimersCount(): number {
    return this.timers.size;
  }
}

/** Global timer manager instance for centralized tracking. */
export const globalTimerManager = new TimerManager();
