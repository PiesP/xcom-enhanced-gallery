/**
 * Scroll Coordinate Manager
 *
 * @description 미디어 클릭 처리 시 스크롤 위치 보호를 담당하는 좌표 관리자
 *
 * 핵심 기능:
 * 1. 현재 스크롤 위치 안전 기록
 * 2. 스크롤 위치 변경 잠금
 * 3. 예기치 않은 스크롤 감시 및 복원
 * 4. 정확한 위치 복원
 *
 * @version 1.0.0 - Clean Architecture 적용
 * @since 2024-06-21
 */

import { logger } from '../../../infrastructure/logging/logger';

interface ScrollPosition {
  x: number;
  y: number;
}

export class ScrollCoordinateManager {
  private static instance: ScrollCoordinateManager;

  private lastKnownPosition: ScrollPosition = { x: 0, y: 0 };
  private positionLocked = false;

  private constructor() {
    // 싱글톤 패턴
  }

  public static getInstance(): ScrollCoordinateManager {
    if (!ScrollCoordinateManager.instance) {
      ScrollCoordinateManager.instance = new ScrollCoordinateManager();
    }
    return ScrollCoordinateManager.instance;
  }

  /**
   * 현재 스크롤 위치를 안전하게 기록
   */
  public captureCurrentPosition(): void {
    if (!this.positionLocked) {
      this.lastKnownPosition = {
        x: window.scrollX,
        y: window.scrollY,
      };
      logger.debug('스크롤 위치 캡처됨:', this.lastKnownPosition);
    }
  }

  /**
   * 스크롤 위치 변경을 잠금
   */
  public lockPosition(): void {
    this.captureCurrentPosition();
    this.positionLocked = true;

    // 추가 보안: 스크롤 이벤트 감시
    this.startScrollMonitoring();

    logger.debug('스크롤 위치 잠금됨:', this.lastKnownPosition);
  }

  /**
   * 스크롤 위치 잠금 해제 및 복원
   */
  public unlockAndRestore(): void {
    this.stopScrollMonitoring();

    if (this.positionLocked) {
      this.restorePosition();
      this.positionLocked = false;
      logger.debug('스크롤 위치 복원 및 잠금 해제됨');
    }
  }

  /**
   * 스크롤 모니터링 시작
   */
  private startScrollMonitoring(): void {
    window.addEventListener('scroll', this.handleUnexpectedScroll, { passive: false });
  }

  /**
   * 스크롤 모니터링 중지
   */
  private stopScrollMonitoring(): void {
    window.removeEventListener('scroll', this.handleUnexpectedScroll);
  }

  /**
   * 예기치 않은 스크롤 처리
   */
  private readonly handleUnexpectedScroll = (e: Event): void => {
    if (this.positionLocked) {
      // 예기치 않은 스크롤 발생 시 즉시 복원
      e.preventDefault();
      this.restorePosition();
      logger.warn('예기치 않은 스크롤 감지 및 복원됨');
    }
  };

  /**
   * 스크롤 위치 복원
   */
  private restorePosition(): void {
    window.scrollTo({
      left: this.lastKnownPosition.x,
      top: this.lastKnownPosition.y,
      behavior: 'instant',
    });
  }

  /**
   * 현재 잠금 상태 확인
   */
  public isLocked(): boolean {
    return this.positionLocked;
  }

  /**
   * 저장된 위치 반환
   */
  public getSavedPosition(): ScrollPosition {
    return { ...this.lastKnownPosition };
  }

  /**
   * 강제 해제 (비상시)
   */
  public forceUnlock(): void {
    logger.warn('스크롤 좌표 관리자 강제 해제');
    this.stopScrollMonitoring();
    this.positionLocked = false;
  }
}
