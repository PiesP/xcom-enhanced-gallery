/**
 * @fileoverview 타이머 서비스 (표준화 완료)
 * @description Phase 4: 네이밍 표준화 - PC 전용 userscript 최적화
 * @version 3.0.0 - 표준화된 파일명과 메서드명 적용
 */

/**
 * 타이머 서비스
 * 모든 타이머를 추적하고 일괄 정리할 수 있는 PC 전용 최적화 서비스
 */
export class TimerService {
  private readonly timers = new Set<number>();
  private readonly intervals = new Set<number>();

  /**
   * setTimeout을 등록하고 추적
   * @param callback 실행할 콜백 함수
   * @param delay 지연 시간 (ms)
   * @returns 타이머 ID
   */
  createTimer(callback: () => void, delay: number): number {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delay);

    this.timers.add(id);
    return id;
  }

  /**
   * setInterval을 등록하고 추적
   * @param callback 실행할 콜백 함수
   * @param delay 반복 간격 (ms)
   * @returns 인터벌 ID
   */
  createInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }

  /**
   * 등록된 setTimeout 제거
   * @param id 타이머 ID
   */
  clearTimer(id: number): void {
    if (this.timers.has(id)) {
      window.clearTimeout(id);
      this.timers.delete(id);
    }
  }

  /**
   * 등록된 setInterval 제거
   * @param id 인터벌 ID
   */
  clearInterval(id: number): void {
    if (this.intervals.has(id)) {
      window.clearInterval(id);
      this.intervals.delete(id);
    }
  }

  /**
   * 모든 타이머 제거 (PC 전용 최적화)
   */
  clearAllTimers(): void {
    this.timers.forEach(id => window.clearTimeout(id));
    this.intervals.forEach(id => window.clearInterval(id));

    this.timers.clear();
    this.intervals.clear();
  }

  /**
   * 활성 타이머 개수 반환
   */
  getActiveTimersCount(): number {
    return this.timers.size;
  }

  /**
   * 활성 인터벌 개수 반환
   */
  getActiveIntervalsCount(): number {
    return this.intervals.size;
  }

  /**
   * 전체 활성 타이머 개수 반환 (타이머 + 인터벌)
   */
  getTotalActiveCount(): number {
    return this.timers.size + this.intervals.size;
  }

  /**
   * 타이머 상태 정보 반환
   */
  getTimerStatus(): {
    timers: number;
    intervals: number;
    total: number;
  } {
    return {
      timers: this.timers.size,
      intervals: this.intervals.size,
      total: this.timers.size + this.intervals.size,
    };
  }

  /**
   * 디버깅을 위한 모든 타이머 ID 반환
   */
  getAllTimerIds(): {
    timers: number[];
    intervals: number[];
  } {
    return {
      timers: Array.from(this.timers),
      intervals: Array.from(this.intervals),
    };
  }

  /**
   * 호환성을 위한 별칭 메서드들
   * @deprecated createTimer를 사용하세요
   */
  setTimeout(callback: () => void, delay: number): number {
    return this.createTimer(callback, delay);
  }

  /**
   * 호환성을 위한 별칭 메서드들
   * @deprecated createInterval을 사용하세요
   */
  setInterval(callback: () => void, delay: number): number {
    return this.createInterval(callback, delay);
  }

  /**
   * 호환성을 위한 별칭 메서드들
   * @deprecated clearTimer를 사용하세요
   */
  clearTimeout(id: number): void {
    this.clearTimer(id);
  }

  /**
   * 호환성을 위한 별칭 메서드들
   * @deprecated clearAllTimers를 사용하세요
   */
  clearAll(): void {
    this.clearAllTimers();
  }
}

/**
 * 전역 타이머 서비스 인스턴스
 * PC 전용 최적화된 싱글톤 패턴
 */
export const globalTimerService = new TimerService();

/**
 * 호환성을 위한 디바운서 함수
 * @param fn 디바운스할 함수
 * @param delay 지연 시간 (ms)
 * @returns 디바운스된 함수
 */
export function createDebouncer<T extends unknown[] = []>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let timerId: number | null = null;

  return (...args: T) => {
    if (timerId !== null) {
      globalTimerService.clearTimer(timerId);
    }
    timerId = globalTimerService.createTimer(() => fn(...args), delay);
  };
}

/**
 * 호환성을 위한 기본 export
 */
export default TimerService;
