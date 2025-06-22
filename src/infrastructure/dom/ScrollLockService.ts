/**
 * @fileoverview Scroll Lock Service - 페이지 스크롤 제어 서비스
 * @version 1.1.0 - Simplified naming
 *
 * 페이지 스크롤 잠금과 갤러리 내부 스크롤을 통합 관리
 * 갤러리 활성화 후에만 스크롤 잠금 적용
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 저장된 페이지 상태 인터페이스
 */
interface SavedPageState {
  scrollY: number;
  bodyOverflow: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyWidth: string;
  bodyPaddingRight: string;
  htmlOverflow: string;
}

/**
 * 스크롤 잠금 서비스
 *
 * 페이지 스크롤 잠금/해제를 관리하고,
 * 갤러리 사용 중 배경 스크롤을 방지합니다.
 */
export class ScrollLockService {
  private static instance: ScrollLockService;
  private isPageScrollLocked = false;
  private savedPageState: SavedPageState | null = null;
  private lockCondition: (() => boolean) | null = null;

  private constructor() {
    // 생성자는 private
  }

  public static getInstance(): ScrollLockService {
    if (!ScrollLockService.instance) {
      ScrollLockService.instance = new ScrollLockService();
    }
    return ScrollLockService.instance;
  }

  /**
   * 스크롤 잠금 조건 설정
   * @param condition 잠금 조건을 반환하는 함수
   */
  public setLockCondition(condition: (() => boolean) | null): void {
    this.lockCondition = condition;
    logger.debug('ScrollLockService: 잠금 조건 설정됨');
  }

  /**
   * 페이지 스크롤 잠금
   */
  public lockPageScroll(): void {
    if (this.isPageScrollLocked) {
      logger.debug('ScrollLockService: 이미 스크롤이 잠금 상태입니다');
      return;
    }

    // 잠금 조건 확인
    if (this.lockCondition && !this.lockCondition()) {
      logger.debug('ScrollLockService: 잠금 조건이 충족되지 않음');
      return;
    }

    try {
      const scrollY = window.scrollY;
      const body = document.body;
      const html = document.documentElement;

      // 현재 상태 저장
      this.savedPageState = {
        scrollY,
        bodyOverflow: body.style.overflow,
        bodyPosition: body.style.position,
        bodyTop: body.style.top,
        bodyLeft: body.style.left,
        bodyWidth: body.style.width,
        bodyPaddingRight: body.style.paddingRight,
        htmlOverflow: html.style.overflow,
      };

      // 스크롤바 너비 계산
      const scrollbarWidth = this.getScrollbarWidth();

      // 스크롤 잠금 스타일 적용
      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.left = '0';
      body.style.width = '100%';
      body.style.paddingRight = `${scrollbarWidth}px`;
      html.style.overflow = 'hidden';

      this.isPageScrollLocked = true;

      logger.debug('ScrollLockService: 페이지 스크롤 잠금 활성화', {
        scrollY,
        scrollbarWidth,
      });
    } catch (error) {
      logger.error('ScrollLockService: 스크롤 잠금 실패', error);
    }
  }

  /**
   * 페이지 스크롤 잠금 해제
   */
  public unlockPageScroll(): void {
    if (!this.isPageScrollLocked || !this.savedPageState) {
      logger.debug('ScrollLockService: 잠금 상태가 아니거나 저장된 상태가 없음');
      return;
    }

    try {
      const body = document.body;
      const html = document.documentElement;
      const savedState = this.savedPageState;

      // 저장된 스타일 복원
      body.style.overflow = savedState.bodyOverflow;
      body.style.position = savedState.bodyPosition;
      body.style.top = savedState.bodyTop;
      body.style.left = savedState.bodyLeft;
      body.style.width = savedState.bodyWidth;
      body.style.paddingRight = savedState.bodyPaddingRight;
      html.style.overflow = savedState.htmlOverflow;

      // 스크롤 위치 복원
      window.scrollTo(0, savedState.scrollY);

      this.isPageScrollLocked = false;
      this.savedPageState = null;

      logger.debug('ScrollLockService: 페이지 스크롤 잠금 해제', {
        restoredScrollY: savedState.scrollY,
      });
    } catch (error) {
      logger.error('ScrollLockService: 스크롤 잠금 해제 실패', error);
    }
  }

  /**
   * 스크롤 잠금 상태 확인
   */
  public isLocked(): boolean {
    return this.isPageScrollLocked;
  }

  /**
   * 갤러리 내부 스크롤 활성화
   * @param galleryElement 갤러리 컨테이너 요소
   */
  public enableGalleryScroll(galleryElement: HTMLElement): void {
    try {
      galleryElement.style.overflow = 'auto';
      galleryElement.style.height = '100vh';
      galleryElement.style.position = 'relative';

      logger.debug('ScrollLockService: 갤러리 스크롤 활성화');
    } catch (error) {
      logger.error('ScrollLockService: 갤러리 스크롤 활성화 실패', error);
    }
  }

  /**
   * 갤러리 내부 스크롤 비활성화
   * @param galleryElement 갤러리 컨테이너 요소
   */
  public disableGalleryScroll(galleryElement: HTMLElement): void {
    try {
      galleryElement.style.overflow = '';
      galleryElement.style.height = '';
      galleryElement.style.position = '';

      logger.debug('ScrollLockService: 갤러리 스크롤 비활성화');
    } catch (error) {
      logger.error('ScrollLockService: 갤러리 스크롤 비활성화 실패', error);
    }
  }

  /**
   * 스크롤바 너비 계산
   */
  private getScrollbarWidth(): number {
    try {
      // 임시 요소 생성하여 스크롤바 너비 측정
      const outer = document.createElement('div');
      outer.style.visibility = 'hidden';
      outer.style.overflow = 'scroll';
      // IE 호환성을 위한 속성 (타입 체킹 우회)
      if ('msOverflowStyle' in outer.style) {
        (outer.style as Record<string, string>).msOverflowStyle = 'scrollbar';
      }
      document.body.appendChild(outer);

      const inner = document.createElement('div');
      outer.appendChild(inner);

      const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

      // 정리
      document.body.removeChild(outer);

      return scrollbarWidth;
    } catch (error) {
      logger.warn('ScrollLockService: 스크롤바 너비 측정 실패, 기본값 사용', error);
      return 17; // 기본 스크롤바 너비
    }
  }

  /**
   * 강제 초기화 (비상시 사용)
   */
  public forceReset(): void {
    try {
      const body = document.body;
      const html = document.documentElement;

      // 모든 스타일 초기화
      // body 스타일 초기화
      body.style.overflow = '';
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.width = '';
      body.style.paddingRight = '';

      html.style.overflow = '';

      this.isPageScrollLocked = false;
      this.savedPageState = null;

      logger.info('ScrollLockService: 강제 초기화 완료');
    } catch (error) {
      logger.error('ScrollLockService: 강제 초기화 실패', error);
    }
  }

  /**
   * 진단 정보 반환
   */
  public getDiagnostics() {
    return {
      isLocked: this.isPageScrollLocked,
      hasSavedState: this.savedPageState !== null,
      hasLockCondition: this.lockCondition !== null,
      currentScrollY: window.scrollY,
      scrollbarWidth: this.getScrollbarWidth(),
    };
  }

  /**
   * 정리
   */
  public cleanup(): void {
    this.forceReset();
    this.lockCondition = null;
  }

  /**
   * @deprecated Use isLocked() instead
   */
  public isPageScrollLockedState(): boolean {
    return this.isLocked();
  }

  /**
   * @deprecated Use forceReset() instead
   */
  public forceUnlock(): void {
    this.forceReset();
  }
}

/**
 * 전역 인스턴스
 */
export const scrollLockService = ScrollLockService.getInstance();

// 편의 함수들
export const lockPageScroll = (): void => scrollLockService.lockPageScroll();
export const unlockPageScroll = (): void => scrollLockService.unlockPageScroll();

// 기존 호환성을 위한 별칭
export const UnifiedScrollManager = ScrollLockService;
export const scrollManager = scrollLockService;
