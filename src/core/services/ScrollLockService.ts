/**
 * Scroll Lock Service
 *
 * 갤러리 오픈 시 페이지 스크롤을 차단하는 통합 서비스
 * Clean Architecture 원칙에 따라 단일 책임으로 설계
 */

import { logger } from '@infrastructure/logging/logger';

interface ScrollState {
  scrollY: number;
  scrollX: number;
  isLocked: boolean;
}

export class ScrollLockService {
  private static instance: ScrollLockService;
  private readonly state: ScrollState = {
    scrollY: 0,
    scrollX: 0,
    isLocked: false,
  };

  private constructor() {}

  public static getInstance(): ScrollLockService {
    if (!ScrollLockService.instance) {
      ScrollLockService.instance = new ScrollLockService();
    }
    return ScrollLockService.instance;
  }

  /**
   * 페이지 스크롤을 잠급니다
   */
  public lock(): void {
    if (this.state.isLocked) {
      return;
    }

    // 현재 스크롤 위치 저장
    this.state.scrollY = window.pageYOffset;
    this.state.scrollX = window.pageXOffset;

    // CSS로만 스크롤 차단 (position: fixed 사용하지 않음)
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    this.state.isLocked = true;

    logger.debug('Page scroll locked', {
      scrollY: this.state.scrollY,
      scrollX: this.state.scrollX,
    });
  }

  /**
   * 페이지 스크롤을 해제합니다
   */
  public unlock(): void {
    if (!this.state.isLocked) {
      return;
    }

    // 스크롤 스타일 복원
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    // 원래 스크롤 위치로 복원
    window.scrollTo(this.state.scrollX, this.state.scrollY);

    this.state.isLocked = false;

    logger.debug('Page scroll unlocked and restored', {
      scrollY: this.state.scrollY,
      scrollX: this.state.scrollX,
    });
  }

  /**
   * 현재 잠금 상태 확인
   */
  public isLocked(): boolean {
    return this.state.isLocked;
  }

  /**
   * 강제 잠금 해제 (오류 복구용)
   */
  public forceUnlock(): void {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.classList.remove('xeg-gallery-open');

    this.state.isLocked = false;

    logger.warn('Page scroll force unlocked');
  }
}

export const scrollLockService = ScrollLockService.getInstance();
