/**
 * @fileoverview Timer Service - REFACTOR: 통합 서비스 사용
 * @description 통합된 타이머 서비스를 사용하는 하위 호환성 래퍼
 * @version 1.1.0 - TDD REFACTOR Phase - 통합 서비스 마이그레이션
 */

import { logger } from '@shared/logging';
import { unifiedTimerService } from '@shared/services/unified-services';

/**
 * 하위 호환성을 위한 타이머 서비스 래퍼
 * @deprecated 새로운 코드에서는 unifiedTimerService를 직접 사용하세요
 */
export class TimerService {
  /**
   * 타이머 설정
   */
  public setTimeout(key: string, callback: () => void, delay: number): void {
    unifiedTimerService.setTimeout(key, callback, delay);
    logger.debug(`Timer set via legacy API: ${key} (${delay}ms)`);
  }

  /**
   * 타이머 해제
   */
  public clearTimeout(key: string): void {
    unifiedTimerService.clearTimeout(key);
    logger.debug(`Timer cleared via legacy API: ${key}`);
  }

  /**
   * 모든 타이머 해제
   */
  public clearAllTimers(): void {
    unifiedTimerService.clearAllTimers();
    logger.debug('All timers cleared via legacy API');
  }

  /**
   * 활성 타이머 수
   */
  public getActiveTimerCount(): number {
    return unifiedTimerService.getActiveTimerCount();
  }
}

// ================================
// REFACTOR: 통합 서비스 사용한 표준화된 인스턴스 export
// ================================

/**
 * 표준화된 TimerService 인스턴스
 * @deprecated 새로운 코드에서는 unifiedTimerService를 직접 사용하세요
 */
export const timerService = new TimerService();

/**
 * Default export (표준 패턴)
 * @deprecated 새로운 코드에서는 unifiedTimerService를 직접 사용하세요
 */
export default timerService;
