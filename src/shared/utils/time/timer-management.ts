/**
 * @fileoverview Timer management utility
 * @description Phase C: Consistent timer and resource management
 *              Simplified: setInterval/clearInterval removed (unused in production)
 * @version 2.1.0
 */

/**
 * Timer ID type
 * In browser environment, window.setTimeout returns number.
 * We explicitly use number for browser-only code.
 */
type TimerId = number;

/**
 * Timer manager
 * Utility to track all setTimeout timers and clean them up in batch.
 * Note: setInterval support was removed as it was unused in production code.
 */
class TimerManager {
  private readonly timers = new Set<TimerId>();

  /**
   * Register and track setTimeout
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
   * Remove registered setTimeout
   */
  clearTimeout(id: TimerId): void {
    if (this.timers.has(id)) {
      window.clearTimeout(id);
      this.timers.delete(id);
    }
  }

  /**
   * Clean up all timers
   */
  cleanup(): void {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers.clear();
  }

  /**
   * Get count of active timers
   */
  getActiveTimersCount(): number {
    return this.timers.size;
  }
}

/**
 * Global timer manager instance
 */
export const globalTimerManager = new TimerManager();
