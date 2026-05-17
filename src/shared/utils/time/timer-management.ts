type TimerId = number;

class TimerManager {
  private readonly timers = new Set<TimerId>();

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

  clearTimeout(id: TimerId): void {
    if (this.timers.has(id)) {
      window.clearTimeout(id);
      this.timers.delete(id);
    }
  }

  cleanup(): void {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers.clear();
  }

  getActiveTimersCount(): number {
    return this.timers.size;
  }
}

export const globalTimerManager = new TimerManager();
