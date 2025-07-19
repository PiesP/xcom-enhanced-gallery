/**
 * @fileoverview Toolbar Timer Manager
 * @version 2.0.0 - CSS 호버 시스템으로 인해 비활성화
 *
 * CSS 호버 시스템으로 인해 JavaScript 기반 툴바 타이머가 불필요해짐
 * - 레거시 호환성을 위해 유지하지만 실제 동작하지 않음
 * - 향후 제거 예정
 */

import { logger } from '@core/logging/logger';
import { ResourceManager } from '@core/managers/ResourceManager';

/**
 * 툴바 타이머 관리자
 * ResourceManager 기반으로 툴바 관련 타이머를 관리합니다.
 */
export class ToolbarTimerManager {
  private static instance: ToolbarTimerManager | null = null;
  private readonly resourceManager: ResourceManager;
  private readonly contextPrefix = 'toolbar';

  private constructor() {
    this.resourceManager = ResourceManager.getInstance();
    logger.debug('ToolbarTimerManager initialized with ResourceManager');
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): ToolbarTimerManager {
    if (!ToolbarTimerManager.instance) {
      ToolbarTimerManager.instance = new ToolbarTimerManager();
    }
    return ToolbarTimerManager.instance;
  }

  /**
   * 싱글톤 인스턴스 해제 (테스트용)
   */
  public static destroy(): void {
    if (ToolbarTimerManager.instance) {
      ToolbarTimerManager.instance.clearAllTimers();
      ToolbarTimerManager.instance = null;
      logger.debug('ToolbarTimerManager destroyed');
    }
  }

  /**
   * 자동 숨김 타이머 설정
   * @param delay - 지연 시간 (밀리초)
   * @param reason - 타이머 설정 이유
   */
  public setAutoHideTimer(delay: number = 1500, reason: string = 'auto'): void {
    if (delay < 0) {
      logger.warn('Invalid delay provided for auto-hide timer', { delay, reason });
      return;
    }

    // 기존 자동 숨김 타이머 제거
    this.clearTimer('auto-hide');

    try {
      const timerId = this.resourceManager.createTimer(
        () => this.handleAutoHideTimeout(reason),
        delay,
        `${this.contextPrefix}-auto-hide`
      );

      logger.debug(`Auto-hide timer set: ${delay}ms (${reason})`, { timerId });
    } catch (error) {
      logger.warn('Failed to set auto-hide timer', { delay, reason, error });
    }
  }

  /**
   * 지연된 자동 숨김 타이머 설정 (호버 종료 시 사용)
   * @param delay - 지연 시간 (기본값: 500ms)
   * @param reason - 타이머 설정 이유
   */
  public setDelayedHideTimer(delay: number = 500, reason: string = 'delayed'): void {
    this.clearTimer('delayed-hide');

    try {
      const timerId = this.resourceManager.createTimer(
        () => this.handleAutoHideTimeout(`delayed-${reason}`),
        delay,
        `${this.contextPrefix}-delayed-hide`
      );

      logger.debug(`Delayed hide timer set: ${delay}ms (${reason})`, { timerId });
    } catch (error) {
      logger.warn('Failed to set delayed hide timer', { delay, reason, error });
    }
  }

  /**
   * 특정 타이머 해제
   * @param name - 타이머 이름
   */
  public clearTimer(name: string): void {
    const context = `${this.contextPrefix}-${name}`;
    this.resourceManager.releaseByContext(context);
    logger.debug(`Timer cleared: ${name}`);
  }

  /**
   * 모든 타이머 해제
   */
  public clearAllTimers(): void {
    const releasedCount = this.resourceManager.releaseByContext(this.contextPrefix);
    logger.debug(`All timers cleared: ${releasedCount} timers`);
  }

  /**
   * 타이머 상태 요약 정보
   */
  public getTimerStatus(): {
    contextPrefix: string;
    message: string;
  } {
    return {
      contextPrefix: this.contextPrefix,
      message: 'Timer management delegated to ResourceManager',
    };
  }

  /**
   * 자동 숨김 타이머 핸들러
   * CSS 호버 시스템으로 인해 비활성화됨
   */
  private handleAutoHideTimeout(reason: string): void {
    try {
      // CSS 호버 시스템으로 인해 JavaScript 기반 툴바 숨김 불필요
      logger.debug(`Auto-hide timer ignored (CSS hover system): ${reason}`);
    } catch (error) {
      logger.warn('Error in auto-hide timer handler', { reason, error });
    }
  }
}

// 편의를 위한 정적 메서드들
export const toolbarTimers = {
  /**
   * 인스턴스 가져오기
   */
  getInstance: () => ToolbarTimerManager.getInstance(),

  /**
   * 자동 숨김 타이머 설정
   */
  setAutoHide: (delay?: number, reason?: string) =>
    ToolbarTimerManager.getInstance().setAutoHideTimer(delay, reason),

  /**
   * 지연된 숨김 타이머 설정
   */
  setDelayedHide: (delay?: number, reason?: string) =>
    ToolbarTimerManager.getInstance().setDelayedHideTimer(delay, reason),

  /**
   * 타이머 해제
   */
  clear: (name: string) => ToolbarTimerManager.getInstance().clearTimer(name),

  /**
   * 모든 타이머 해제
   */
  clearAll: () => ToolbarTimerManager.getInstance().clearAllTimers(),

  /**
   * 타이머 상태 가져오기
   */
  getStatus: () => ToolbarTimerManager.getInstance().getTimerStatus(),
};
