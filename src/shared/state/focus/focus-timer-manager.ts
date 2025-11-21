import { globalTimerManager } from '../../utils/timer-management';
import { logger } from '@shared/logging';

export type FocusTimerRole = 'auto-focus';

interface TimerRecord {
  timerId: number;
}

export class FocusTimerManager {
  private readonly timers = new Map<FocusTimerRole, TimerRecord>();

  setTimer(role: FocusTimerRole, callback: () => void, delay: number): number {
    this.clearTimer(role);

    const timerId = globalTimerManager.setTimeout(
      () => {
        try {
          callback();
        } catch (error) {
          logger.warn('FocusTimerManager: timer callback failed', { role, error });
        } finally {
          this.timers.delete(role);
        }
      },
      Math.max(0, delay)
    );

    this.timers.set(role, { timerId });
    return timerId;
  }

  clearTimer(role: FocusTimerRole): void {
    const record = this.timers.get(role);
    if (!record) {
      return;
    }

    globalTimerManager.clearTimeout(record.timerId);
    this.timers.delete(role);
  }

  clearAll(): void {
    this.timers.forEach(record => {
      globalTimerManager.clearTimeout(record.timerId);
    });
    this.timers.clear();
  }

  hasTimer(role: FocusTimerRole): boolean {
    return this.timers.has(role);
  }

  get size(): number {
    return this.timers.size;
  }
}

export function createFocusTimerManager(): FocusTimerManager {
  return new FocusTimerManager();
}
