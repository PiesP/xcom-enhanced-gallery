/**
 * @fileoverview 타이머 관리 유틸리티
 * @description Phase C: 일관된 타이머 및 리소스 관리
 * @version 1.0.0
 */

import { createDebouncer } from './performance/performance-utils';

/**
 * 타이머 관리자
 * 모든 타이머를 추적하고 일괄 정리할 수 있는 유틸리티
 */
export class TimerManager {
  private readonly timers = new Set<number>();
  private readonly intervals = new Set<number>();

  /**
   * setTimeout을 등록하고 추적
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
   * setInterval을 등록하고 추적
   */
  setInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }

  /**
   * 등록된 setTimeout 제거
   */
  clearTimeout(id: number): void {
    if (this.timers.has(id)) {
      window.clearTimeout(id);
      this.timers.delete(id);
    }
  }

  /**
   * 등록된 setInterval 제거
   */
  clearInterval(id: number): void {
    if (this.intervals.has(id)) {
      window.clearInterval(id);
      this.intervals.delete(id);
    }
  }

  /**
   * 모든 타이머 정리
   */
  cleanup(): void {
    this.timers.forEach(id => window.clearTimeout(id));
    this.intervals.forEach(id => window.clearInterval(id));
    this.timers.clear();
    this.intervals.clear();
  }

  /**
   * 활성 타이머 수 조회
   */
  getActiveTimersCount(): number {
    return this.timers.size + this.intervals.size;
  }
}

/**
 * 전역 타이머 관리자 인스턴스
 */
export const globalTimerManager = new TimerManager();

/**
 * 안전한 performance.now() 호출
 *
 * @returns 현재 시간 또는 Date.now() fallback
 */
export function safePerformanceNow(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  return Date.now();
}

// Performance measurement is available from performance-utils
export { measurePerformance, measureAsyncPerformance } from './performance/performance-utils';

/**
 * 타이머 관리와 함께 사용하는 debounce 함수
 *
 * @param fn - debounce할 함수
 * @param delay - 지연 시간
 * @param _timerManager - 타이머 관리자 (선택사항, 현재 미사용)
 * @returns debounced 함수
 */
export function createManagedDebounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
  _timerManager: TimerManager = globalTimerManager
): (...args: Parameters<T>) => void {
  // performance-utils의 createDebouncer를 기반으로 하되, TimerManager 통합
  const debouncer = createDebouncer(fn as (...args: unknown[]) => void, delay);

  return (...args: Parameters<T>) => {
    // TimerManager와의 통합을 위해 기존 타이머를 추적
    debouncer.execute(...args);
  };
}

/**
 * 개선된 throttle 함수
 *
 * @param fn - throttle할 함수
 * @param delay - throttle 간격
 * @returns throttled 함수
 */
export function createManagedThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastExecution = 0;

  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    const now = safePerformanceNow();
    if (now - lastExecution >= delay) {
      lastExecution = now;
      return fn(...args) as ReturnType<T>;
    }
    return undefined;
  };
}
