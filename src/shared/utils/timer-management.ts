/**
 * @fileoverview Timer management utility
 * @description Phase C: Consistent timer and resource management
 * @version 1.0.0
 */
/**
 * Timer manager
 * Utility to track all timers and clean them up in batch
 */
export class TimerManager {
  private readonly timers = new Set<number>();
  private readonly intervals = new Set<number>();

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
   * Register and track setInterval
   */
  setInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(callback, delay);
    this.intervals.add(id);
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
   * Remove registered setInterval
   */
  clearInterval(id: number): void {
    if (this.intervals.has(id)) {
      window.clearInterval(id);
      this.intervals.delete(id);
    }
  }

  /**
   * Clean up all timers
   */
  cleanup(): void {
    this.timers.forEach(id => window.clearTimeout(id));
    this.intervals.forEach(id => window.clearInterval(id));
    this.timers.clear();
    this.intervals.clear();
  }

  /**
   * Get count of active timers
   */
  getActiveTimersCount(): number {
    return this.timers.size + this.intervals.size;
  }
}

/**
 * Global timer manager instance
 */
export const globalTimerManager = new TimerManager();

/**
 * Consistent high-resolution timestamp helper
 *
 * @returns Current timestamp using performance.now()
 */
export function safePerformanceNow(): number {
  return performance.now();
}
