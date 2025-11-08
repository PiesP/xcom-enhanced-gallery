/**
 * Focus Timer Management
 *
 * Centralized management of focus tracking timers.
 * Manages timers by role: auto-focus, recompute, flush-batch, auto-focus-debounce, etc.
 */

import { getSolid } from '../../external/vendors';
import { globalTimerManager, safePerformanceNow } from '../../utils/timer-management';
import { logger } from '@shared/logging';

/**
 * Timer role type
 */
export type FocusTimerRole = 'auto-focus' | 'recompute' | 'flush-batch' | 'auto-focus-debounce';

/**
 * Timer callback
 */
type FocusTimerCallback = () => void;

/**
 * Timer metadata
 */
interface TimerRecord {
  role: FocusTimerRole;
  timerId: number;
  startTime: number;
  delay: number;
  callback: FocusTimerCallback;
}

/**
 * Focus timer manager
 * Set/clear/query timers by role from central location
 */
export class FocusTimerManager {
  /** Timer records management by role */
  private readonly timers: Map<FocusTimerRole, TimerRecord> = new Map();

  /** Solid.js createEffect cleanup functions */
  private disposers: Array<() => void> = [];

  /**
   * Set or update existing timer
   * @param role Timer role
   * @param callback Callback function
   * @param delay Delay time (ms)
   * @returns Set timer ID
   */
  setTimer(role: FocusTimerRole, callback: FocusTimerCallback, delay: number): number {
    // Clean up existing timer
    this.clearTimer(role);

    // Set new timer
    const timerId = globalTimerManager.setTimeout(() => {
      try {
        callback();
      } catch (error) {
        logger.warn('FocusTimerManager: timer callback error', { role, error });
      } finally {
        // Remove timer record
        this.timers.delete(role);
      }
    }, delay);

    const record: TimerRecord = {
      role,
      timerId,
      startTime: safePerformanceNow(),
      delay,
      callback,
    };

    this.timers.set(role, record);

    logger.debug('FocusTimerManager: timer set', { role, delay, timerId });

    return timerId;
  }

  /**
   * Clear timer for specific role
   * @param role Timer role
   */
  clearTimer(role: FocusTimerRole): void {
    const record = this.timers.get(role);
    if (!record) {
      return;
    }

    globalTimerManager.clearTimeout(record.timerId);
    this.timers.delete(role);

    logger.debug('FocusTimerManager: timer cleared', { role, timerId: record.timerId });
  }

  /**
   * Clear all timers
   */
  clearAll(): void {
    this.timers.forEach(record => {
      globalTimerManager.clearTimeout(record.timerId);
    });
    this.timers.clear();

    logger.debug('FocusTimerManager: all timers cleared');
  }

  /**
   * Check if timer exists for specific role
   */
  hasTimer(role: FocusTimerRole): boolean {
    return this.timers.has(role);
  }

  /**
   * Get timer information for specific role
   */
  getTimer(role: FocusTimerRole): TimerRecord | undefined {
    return this.timers.get(role);
  }

  /**
   * Get all active timers
   */
  getAllTimers(): TimerRecord[] {
    return Array.from(this.timers.values());
  }

  /**
   * Calculate elapsed time for timer with specific role
   */
  getElapsedTime(role: FocusTimerRole): number {
    const record = this.timers.get(role);
    if (!record) {
      return 0;
    }

    return safePerformanceNow() - record.startTime;
  }

  /**
   * Calculate remaining time for timer with specific role
   */
  getRemainingTime(role: FocusTimerRole): number {
    const record = this.timers.get(role);
    if (!record) {
      return 0;
    }

    const elapsed = safePerformanceNow() - record.startTime;
    return Math.max(0, record.delay - elapsed);
  }

  /**
   * Solid.js cleanup 함수 등록 (자동 정리 용도)
   */
  registerDisposer(disposer: () => void): void {
    this.disposers.push(disposer);
  }

  /**
   * 모든 리소스 정리 및 타이머 클리어
   */
  dispose(): void {
    this.clearAll();
    this.disposers.forEach(disposer => {
      try {
        disposer();
      } catch (error) {
        logger.warn('FocusTimerManager: disposer error', { error });
      }
    });
    this.disposers = [];

    logger.debug('FocusTimerManager: disposed');
  }

  /**
   * 활성 타이머 개수
   */
  get size(): number {
    return this.timers.size;
  }

  /**
   * 디버그 정보 조회
   */
  getDebugInfo(): {
    activeTimers: number;
    timers: Array<{ role: FocusTimerRole; elapsed: number; remaining: number }>;
  } {
    return {
      activeTimers: this.timers.size,
      timers: Array.from(this.timers.values()).map(record => ({
        role: record.role,
        elapsed: this.getElapsedTime(record.role),
        remaining: this.getRemainingTime(record.role),
      })),
    };
  }
}

/**
 * FocusTimerManager 싱글톤 팩토리
 */
export function createFocusTimerManager(): FocusTimerManager {
  return new FocusTimerManager();
}

/**
 * Solid.js 통합용 Hook: FocusTimerManager 자동 정리
 */
export function useFocusTimerManager(): FocusTimerManager {
  const { createEffect, onCleanup } = getSolid();
  const manager = createFocusTimerManager();

  // Solid.js cleanup 함수에서 타이머 자동 정리
  createEffect(() => {
    onCleanup(() => {
      manager.dispose();
    });
  });

  return manager;
}
