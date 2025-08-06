/**
 * @fileoverview 타이머 관리 유틸리티
 * @description Phase C: 일관된 타이머 및 리소스 관리 (성능 유틸리티 통합 완료)
 * @version 2.0.0 - PerformanceUtils 통합
 */

// 성능 유틸리티는 PerformanceUtils로 통합됨 - 호환성을 위해 re-export
export { PerformanceUtils } from '@shared/utils/performance/performance-utils-enhanced';

/**
 * 호환성을 위한 createDebouncer 함수
 * @deprecated PerformanceUtils.debounce를 사용하세요
 */
export function createDebouncer<T extends unknown[] = []>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  console.warn('createDebouncer는 deprecated입니다. PerformanceUtils.debounce를 사용하세요.');
  const { PerformanceUtils } = require('@shared/utils/performance/performance-utils-enhanced');
  return PerformanceUtils.debounce(fn, delay);
}

/**
 * 호환성을 위한 Debouncer 클래스
 * @deprecated PerformanceUtils.debounce를 사용하세요
 */
export class Debouncer<T extends unknown[] = []> {
  private readonly debouncedFn: (...args: T) => void;

  constructor(fn: (...args: T) => void, delay: number) {
    console.warn('Debouncer 클래스는 deprecated입니다. PerformanceUtils.debounce를 사용하세요.');
    const { PerformanceUtils } = require('@shared/utils/performance/performance-utils-enhanced');
    this.debouncedFn = PerformanceUtils.debounce(fn, delay);
  }

  call(...args: T): void {
    this.debouncedFn(...args);
  }

  isPending(): boolean {
    // PerformanceUtils.debounce는 이 메서드를 지원하지 않음
    return false;
  }
}

/**
 * 타이머 서비스
 * 모든 타이머를 추적하고 일괄 정리할 수 있는 유틸리티
 */
export class TimerService {
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
   * 모든 등록된 타이머 제거
   */
  clearAllTimers(): void {
    this.timers.forEach(id => window.clearTimeout(id));
    this.intervals.forEach(id => window.clearInterval(id));
    this.timers.clear();
    this.intervals.clear();
  }

  /**
   * 현재 등록된 타이머 수
   */
  getActiveTimersCount(): { timeouts: number; intervals: number } {
    return {
      timeouts: this.timers.size,
      intervals: this.intervals.size,
    };
  }
}

/**
 * 전역 타이머 서비스 인스턴스
 */
export const globalTimerService = new TimerService();

/**
 * 지연 실행 유틸리티
 */
export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => globalTimerService.setTimeout(resolve, ms));

/**
 * 특정 조건이 만족될 때까지 대기
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    timeoutMessage?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 5000,
    interval = 100,
    timeoutMessage = 'Timeout waiting for condition',
  } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await delay(interval);
  }

  throw new Error(timeoutMessage);
}

/**
 * RAF 기반 지연 실행
 */
export const rafDelay = (frames = 1): Promise<void> =>
  new Promise(resolve => {
    let count = 0;
    const tick = () => {
      if (++count >= frames) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });

// Performance utilities re-export - 호환성을 위해 직접 경로 사용
export {
  measureAsyncPerformance,
  rafThrottle,
} from '@shared/utils/performance/performance-utils-enhanced';
