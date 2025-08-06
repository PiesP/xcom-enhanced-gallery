/**
 * @fileoverview 타이머 관리 유틸리티
 * @description Phase C: 일관된 타이머 및 리소스 관리
 * @version 1.0.0
 */

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
 * 전역 타이머 서비스 인스턴스
 */
export const globalTimerManager = new TimerService();

// 하위 호환성을 위한 별칭
export { TimerService as TimerManager };

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

/**
 * 디바운서 클래스
 * 연속된 함수 호출을 지연시켜 성능을 최적화
 */
export class Debouncer<T extends unknown[] = []> {
  private timeoutId: number | null = null;

  constructor(
    private readonly callback: (...args: T) => void,
    private readonly delay: number
  ) {}

  /**
   * 디바운스된 함수 실행
   */
  execute(...args: T): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      this.timeoutId = null;
      this.callback(...args);
    }, this.delay);
  }

  /**
   * 디바운서 정리
   */
  cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * 디바운서가 활성 상태인지 확인
   */
  isPending(): boolean {
    return this.timeoutId !== null;
  }
}

/**
 * 디바운서 생성 함수
 */
export function createDebouncer<T extends unknown[] = []>(
  callback: (...args: T) => void,
  delay: number
): Debouncer<T> {
  return new Debouncer(callback, delay);
}

// Performance utilities re-export - 호환성을 위해 직접 경로 사용
export {
  measureAsyncPerformance,
  rafThrottle,
} from '@shared/utils/performance/performance-utils-enhanced';
