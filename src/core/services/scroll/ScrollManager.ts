/**
 * @fileoverview 통합 스크롤 관리 시스템
 * @version 2.0.0
 *
 * 페이지 스크롤 보호와 갤러리 내부 스크롤을 통합 관리하는 시스템
 * 트위터 페이지 스크롤 문제를 근본적으로 해결합니다.
 */

import { logger } from '../../../infrastructure/logging/logger';

export interface ScrollPosition {
  x: number;
  y: number;
}

export interface ScrollState {
  isLocked: boolean;
  savedPosition: ScrollPosition;
  lockTimestamp: number;
}

export interface GalleryScrollOptions {
  behavior?: ScrollBehavior;
  offset?: number;
  debounceDelay?: number;
}

/**
 * 통합 스크롤 관리자
 *
 * 주요 기능:
 * - 페이지 스크롤 잠금/해제
 * - 갤러리 내부 스크롤 관리
 * - 스크롤 위치 복원
 * - 안전한 스크롤 방지
 */
export class ScrollManager {
  private static instance: ScrollManager;

  // 페이지 스크롤 상태
  private readonly pageScrollState: ScrollState = {
    isLocked: false,
    savedPosition: { x: 0, y: 0 },
    lockTimestamp: 0,
  };

  // 갤러리 내부 스크롤 상태
  private readonly galleryScrollState = {
    focusedImageIndex: 0,
    savedScrollPosition: 0,
    lastScrollTime: 0,
  };

  // 설정
  private readonly scrollDebounceDelay = 50;

  private constructor() {}

  public static getInstance(): ScrollManager {
    ScrollManager.instance ??= new ScrollManager();
    return ScrollManager.instance;
  }

  // ===== 페이지 스크롤 보호 기능 =====

  /**
   * 페이지 스크롤 즉시 잠금
   */
  public lockPageScroll(): ScrollPosition {
    if (this.pageScrollState.isLocked) {
      return this.pageScrollState.savedPosition;
    }

    // 현재 스크롤 위치 저장
    const currentPosition = {
      x: window.scrollX || window.pageXOffset || 0,
      y: window.scrollY || window.pageYOffset || 0,
    };

    this.pageScrollState.savedPosition = currentPosition;
    this.pageScrollState.lockTimestamp = Date.now();

    // CSS 기반 스크롤 잠금 적용
    this.applyCSSLock(currentPosition);
    this.pageScrollState.isLocked = true;

    logger.debug('ScrollManager: 페이지 스크롤 잠금 적용', {
      position: currentPosition,
      timestamp: this.pageScrollState.lockTimestamp,
    });

    return currentPosition;
  }

  /**
   * 페이지 스크롤 잠금 해제 및 위치 복원
   */
  public unlockPageScroll(): void {
    if (!this.pageScrollState.isLocked) {
      return;
    }

    // CSS 잠금 해제
    this.removeCSSLock();

    // 원래 위치로 복원
    window.scrollTo({
      left: this.pageScrollState.savedPosition.x,
      top: this.pageScrollState.savedPosition.y,
      behavior: 'instant',
    });

    this.pageScrollState.isLocked = false;

    logger.debug('ScrollManager: 페이지 스크롤 잠금 해제', {
      restoredPosition: this.pageScrollState.savedPosition,
    });
  }

  /**
   * 페이지 스크롤 잠금 상태 확인
   */
  public isPageScrollLocked(): boolean {
    return this.pageScrollState.isLocked;
  }

  /**
   * 저장된 페이지 스크롤 위치 반환
   */
  public getSavedPagePosition(): ScrollPosition {
    return { ...this.pageScrollState.savedPosition };
  }

  // ===== 갤러리 내부 스크롤 관리 =====

  /**
   * 갤러리 내부 스크롤을 특정 이미지로 이동
   */
  public scrollToGalleryItem(
    containerElement: HTMLElement,
    itemIndex: number,
    options: GalleryScrollOptions = {}
  ): void {
    const { behavior = 'smooth', offset = 0, debounceDelay = this.scrollDebounceDelay } = options;

    // 디바운스 처리
    const currentTime = Date.now();
    if (currentTime - this.galleryScrollState.lastScrollTime < debounceDelay) {
      return;
    }
    this.galleryScrollState.lastScrollTime = currentTime;

    // 배경 요소 스크롤 방지
    if (this.isBackgroundElement(containerElement)) {
      logger.warn('ScrollManager: 배경 요소 스크롤 시도 차단');
      return;
    }

    const targetElement = this.findGalleryItem(containerElement, itemIndex);
    if (!targetElement) {
      logger.warn(`ScrollManager: 인덱스 ${itemIndex}의 갤러리 아이템을 찾을 수 없음`);
      return;
    }

    // 안전한 스크롤 실행
    const scrollPosition = targetElement.offsetTop + offset;
    containerElement.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior,
    });

    this.galleryScrollState.focusedImageIndex = itemIndex;
    this.galleryScrollState.savedScrollPosition = scrollPosition;

    logger.debug(`ScrollManager: 갤러리 아이템 ${itemIndex}로 스크롤`, {
      position: scrollPosition,
    });
  }

  /**
   * 갤러리 스크롤 위치 저장
   */
  public saveGalleryScrollPosition(position: number): void {
    this.galleryScrollState.savedScrollPosition = position;
  }

  /**
   * 갤러리 스크롤 위치 복원
   */
  public restoreGalleryScrollPosition(containerElement: HTMLElement): void {
    containerElement.scrollTo({
      top: this.galleryScrollState.savedScrollPosition,
      behavior: 'auto',
    });

    logger.debug('ScrollManager: 갤러리 스크롤 위치 복원', {
      position: this.galleryScrollState.savedScrollPosition,
    });
  }

  /**
   * 현재 포커스된 갤러리 아이템 인덱스
   */
  public getFocusedItemIndex(): number {
    return this.galleryScrollState.focusedImageIndex;
  }

  // ===== 진단 및 상태 관리 =====

  /**
   * 전체 상태 강제 초기화
   */
  public forceReset(): void {
    this.pageScrollState.isLocked = false;
    this.pageScrollState.savedPosition = { x: 0, y: 0 };
    this.pageScrollState.lockTimestamp = 0;

    this.galleryScrollState.focusedImageIndex = 0;
    this.galleryScrollState.savedScrollPosition = 0;
    this.galleryScrollState.lastScrollTime = 0;

    this.removeCSSLock();

    logger.debug('ScrollManager: 전체 상태 강제 초기화 완료');
  }

  /**
   * 진단 정보 반환
   */
  public getDiagnostics() {
    return {
      pageScroll: {
        isLocked: this.pageScrollState.isLocked,
        savedPosition: { ...this.pageScrollState.savedPosition },
        lockTimestamp: this.pageScrollState.lockTimestamp,
      },
      galleryScroll: {
        focusedImageIndex: this.galleryScrollState.focusedImageIndex,
        savedScrollPosition: this.galleryScrollState.savedScrollPosition,
        lastScrollTime: this.galleryScrollState.lastScrollTime,
      },
    };
  }

  // ===== 내부 메서드 =====

  /**
   * CSS 기반 스크롤 잠금 적용
   */
  private applyCSSLock(position: ScrollPosition): void {
    const body = document.body;
    const html = document.documentElement;

    // 스크롤바 너비 계산
    const scrollbarWidth = this.getScrollbarWidth();

    // 스크롤 잠금 스타일 적용
    body.style.position = 'fixed';
    body.style.top = `-${position.y}px`;
    body.style.left = `-${position.x}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.paddingRight = `${scrollbarWidth}px`;

    html.style.overflow = 'hidden';
    body.classList.add('xeg-scroll-locked');
  }

  /**
   * CSS 스크롤 잠금 해제
   */
  private removeCSSLock(): void {
    const body = document.body;
    const html = document.documentElement;

    // 스타일 복원
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.width = '';
    body.style.overflow = '';
    body.style.paddingRight = '';

    html.style.overflow = '';
    body.classList.remove('xeg-scroll-locked');
  }

  /**
   * 스크롤바 너비 계산
   */
  private getScrollbarWidth(): number {
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    document.body.appendChild(outer);

    const inner = document.createElement('div');
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    outer.parentNode?.removeChild(outer);

    return scrollbarWidth;
  }

  /**
   * 갤러리 아이템 찾기
   */
  private findGalleryItem(containerElement: HTMLElement, itemIndex: number): HTMLElement | null {
    const selectors = [
      `[data-index="${itemIndex}"]`,
      `[data-item-index="${itemIndex}"]`,
      `.gallery-item:nth-child(${itemIndex + 1})`,
      `.item:nth-child(${itemIndex + 1})`,
    ];

    for (const selector of selectors) {
      const element = containerElement.querySelector(selector) as HTMLElement;
      if (element) {
        return element;
      }
    }

    return null;
  }

  /**
   * 배경 요소인지 확인 (갤러리 외부 요소)
   */
  private isBackgroundElement(element: HTMLElement): boolean {
    const gallerySelectors = [
      '.xeg-gallery',
      '.gallery-container',
      '.vertical-gallery',
      '[data-gallery]',
    ];

    // 갤러리 컨테이너 내부인지 확인
    for (const selector of gallerySelectors) {
      if (element.closest(selector)) {
        return false; // 갤러리 내부 요소
      }
    }

    return true; // 배경 요소
  }
}

// 전역 인스턴스 내보내기
export const scrollManager = ScrollManager.getInstance();
