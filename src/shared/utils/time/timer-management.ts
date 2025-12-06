/**
 * @fileoverview Timer management utility
 * @description Phase C: Consistent timer and resource management
 *              Simplified: setInterval/clearInterval removed (unused in production)
 * @version 2.0.0
 */

/**
 * Timer manager
 * Utility to track all setTimeout timers and clean them up in batch.
 * Note: setInterval support was removed as it was unused in production code.
 */
export class TimerManager {
  private readonly timers = new Set<number>();

  /**
   * Register and track setTimeout
   */
  setTimeout(callback: () => void, delay: number): number {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delay);

    this.timers.add(id);
    return id;
  }

  /**
   * Remove registered setTimeout
   */
  clearTimeout(id: number): void {
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
