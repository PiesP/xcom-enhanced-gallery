/**
 * @fileoverview 타이머 서비스
 * @description TDD 기반 Manager → Service 네이밍 통일
 * @version 2.0.0
 */

/**
 * 타이머 서비스
 * 모든 타이머를 추적하고 일괄 정리할 수 있는 서비스
 */
export class TimerService {
  private readonly timers = new Set<number>();
  private readonly intervals = new Set<number>();

  /**
   * setTimeout을 등록하고 추적
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
   */
  createInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }

  /**
   * 등록된 setTimeout 제거
   */
  clearTimer(id: number): void {
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
   * 모든 타이머 제거
   */
  clearAll(): void {
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
  getStatus(): {
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
}
