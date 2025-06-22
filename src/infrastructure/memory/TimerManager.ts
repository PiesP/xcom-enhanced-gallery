/**
 * @fileoverview Timer Manager - setTimeout, setInterval 관리
 * @version 1.0.0
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * Timer 관리 유틸리티
 * setTimeout과 setInterval을 추적하고 정리합니다.
 */
export class TimerManager {
  private readonly timers = new Set<number>();
  private readonly intervals = new Set<number>();

  /**
   * setTimeout을 등록하고 추적합니다.
   */
  public setTimeout(callback: () => void, delay: number): number {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delay);

    this.timers.add(id);
    return id;
  }

  /**
   * setInterval을 등록하고 추적합니다.
   */
  public setInterval(callback: () => void, interval: number): number {
    const id = window.setInterval(callback, interval);
    this.intervals.add(id);
    return id;
  }

  /**
   * 특정 timer를 정리합니다.
   */
  public clearTimeout(id: number): void {
    if (this.timers.has(id)) {
      clearTimeout(id);
      this.timers.delete(id);
    }
  }

  /**
   * 특정 interval을 정리합니다.
   */
  public clearInterval(id: number): void {
    if (this.intervals.has(id)) {
      clearInterval(id);
      this.intervals.delete(id);
    }
  }

  /**
   * 모든 timer와 interval을 정리합니다.
   */
  public cleanup(): void {
    // 모든 setTimeout 정리
    for (const id of this.timers) {
      clearTimeout(id);
    }
    this.timers.clear();

    // 모든 setInterval 정리
    for (const id of this.intervals) {
      clearInterval(id);
    }
    this.intervals.clear();

    logger.debug('[TimerManager] All timers and intervals cleared');
  }

  /**
   * 현재 활성 timer 수 조회
   */
  public getActiveCount(): { timers: number; intervals: number } {
    return {
      timers: this.timers.size,
      intervals: this.intervals.size,
    };
  }
}
