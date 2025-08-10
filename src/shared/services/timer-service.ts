/**
 * @fileoverview Timer Service - 타이머 관리 서비스
 * @description Phase 4: Service Naming Standardization에서 추가된 기본 타이머 서비스
 * @version 1.0.0
 */

import { logger } from '@shared/logging';

/**
 * 간단한 타이머 관리 서비스
 */
export class TimerService {
  private readonly timers = new Map<string, number>();

  /**
   * 타이머 설정
   */
  public setTimeout(key: string, callback: () => void, delay: number): void {
    this.clearTimeout(key); // 기존 타이머 정리
    const timerId = window.setTimeout(() => {
      this.timers.delete(key);
      callback();
    }, delay);
    this.timers.set(key, timerId);
    logger.debug(`Timer set: ${key} (${delay}ms)`);
  }

  /**
   * 타이머 해제
   */
  public clearTimeout(key: string): void {
    const timerId = this.timers.get(key);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      this.timers.delete(key);
      logger.debug(`Timer cleared: ${key}`);
    }
  }

  /**
   * 모든 타이머 해제
   */
  public clearAllTimers(): void {
    for (const [_key, timerId] of this.timers) {
      window.clearTimeout(timerId);
    }
    this.timers.clear();
    logger.debug('All timers cleared');
  }

  /**
   * 활성 타이머 수
   */
  public getActiveTimerCount(): number {
    return this.timers.size;
  }
}

// ================================
// Phase 4: 표준화된 인스턴스 export
// ================================

/**
 * 표준화된 TimerService 인스턴스
 */
export const timerService = new TimerService();

/**
 * Default export (표준 패턴)
 */
export default timerService;
