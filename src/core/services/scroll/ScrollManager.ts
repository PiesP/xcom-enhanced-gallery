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
  backupPosition?: ScrollPosition | undefined; // 백업 위치 (복원 실패 시 사용)
  forceRestoreAttempts: number; // 강제 복원 시도 횟수
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
    forceRestoreAttempts: 0,
  };

  // 갤러리 내부 스크롤 상태
  private readonly galleryScrollState = {
    focusedImageIndex: 0,
    savedScrollPosition: 0,
    lastScrollTime: 0,
  };

  // 설정
  private readonly scrollDebounceDelay = 50;

  private constructor() { }

  public static getInstance(): ScrollManager {
    ScrollManager.instance ??= new ScrollManager();
    return ScrollManager.instance;
  }

  // ===== 페이지 스크롤 보호 기능 =====

  /**
   * 페이지 스크롤 즉시 잠금 (강화된 버전)
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
    this.pageScrollState.backupPosition = { ...currentPosition }; // 백업 위치 저장
    this.pageScrollState.lockTimestamp = Date.now();
    this.pageScrollState.forceRestoreAttempts = 0;

    // CSS 기반 스크롤 잠금 적용
    this.applyCSSLock(currentPosition);
    this.pageScrollState.isLocked = true;

    logger.debug('ScrollManager: 페이지 스크롤 잠금 적용 (강화된 버전)', {
      position: currentPosition,
      timestamp: this.pageScrollState.lockTimestamp,
    });

    return currentPosition;
  }

  /**
   * 페이지 스크롤 잠금 해제 및 위치 복원 (강화된 버전)
   */
  public unlockPageScroll(): void {
    if (!this.pageScrollState.isLocked) {
      return;
    }

    // CSS 잠금 해제
    this.removeCSSLock();

    // 원래 위치로 복원 (실패 시 재시도)
    this.restoreScrollPositionSafely();

    this.pageScrollState.isLocked = false;

    logger.debug('ScrollManager: 페이지 스크롤 잠금 해제 (강화된 버전)', {
      restoredPosition: this.pageScrollState.savedPosition,
      forceRestoreAttempts: this.pageScrollState.forceRestoreAttempts,
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

  /**
   * 강제 스크롤 위치 복원 (비상 상황 시)
   */
  public forceRestoreScrollPosition(): void {
    if (this.pageScrollState.forceRestoreAttempts >= 3) {
      logger.warn('ScrollManager: 강제 복원 시도 한도 초과, 복원 중단');
      return;
    }

    this.pageScrollState.forceRestoreAttempts++;
    const targetPosition =
      this.pageScrollState.backupPosition || this.pageScrollState.savedPosition;

    // 즉시 복원 시도
    window.scrollTo({
      left: targetPosition.x,
      top: targetPosition.y,
      behavior: 'instant',
    });

    // 50ms 후 검증 및 재시도
    setTimeout(() => {
      const currentX = window.scrollX || window.pageXOffset || 0;
      const currentY = window.scrollY || window.pageYOffset || 0;

      if (Math.abs(currentX - targetPosition.x) > 5 || Math.abs(currentY - targetPosition.y) > 5) {
        logger.warn('ScrollManager: 스크롤 위치 복원 실패, 재시도 중', {
          target: targetPosition,
          current: { x: currentX, y: currentY },
          attempt: this.pageScrollState.forceRestoreAttempts,
        });

        if (this.pageScrollState.forceRestoreAttempts < 3) {
          this.forceRestoreScrollPosition();
        }
      } else {
        logger.debug('ScrollManager: 강제 스크롤 위치 복원 성공', {
          position: targetPosition,
          attempts: this.pageScrollState.forceRestoreAttempts,
        });
      }
    }, 50);
  }

  // ===== 진단 및 상태 관리 =====

  /**
   * 전체 상태 강제 초기화 (강화된 버전)
   */
  public forceReset(): void {
    this.pageScrollState.isLocked = false;
    this.pageScrollState.savedPosition = { x: 0, y: 0 };
    this.pageScrollState.lockTimestamp = 0;
    this.pageScrollState.forceRestoreAttempts = 0;
    delete this.pageScrollState.backupPosition;

    this.galleryScrollState.focusedImageIndex = 0;
    this.galleryScrollState.savedScrollPosition = 0;
    this.galleryScrollState.lastScrollTime = 0;

    this.removeCSSLock();

    logger.debug('ScrollManager: 전체 상태 강제 초기화 완료 (강화된 버전)');
  }

  /**
   * 진단 정보 반환 (강화된 버전)
   */
  public getDiagnostics() {
    return {
      pageScroll: {
        isLocked: this.pageScrollState.isLocked,
        savedPosition: { ...this.pageScrollState.savedPosition },
        backupPosition: this.pageScrollState.backupPosition
          ? { ...this.pageScrollState.backupPosition }
          : undefined,
        lockTimestamp: this.pageScrollState.lockTimestamp,
        forceRestoreAttempts: this.pageScrollState.forceRestoreAttempts,
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
   * CSS 기반 스크롤 잠금 적용 (강화된 버전)
   */
  private applyCSSLock(position: ScrollPosition): void {
    const body = document.body;
    const html = document.documentElement;

    // 스크롤바 너비 계산
    const scrollbarWidth = this.getScrollbarWidth();

    // CSS 변수를 통한 위치 저장 (모바일 대응)
    document.documentElement.style.setProperty('--xeg-scroll-lock-top', `-${position.y}px`);
    document.documentElement.style.setProperty('--xeg-scroll-lock-left', `-${position.x}px`);
    document.documentElement.style.setProperty('--xeg-scrollbar-width', `${scrollbarWidth}px`);

    // 스크롤 잠금 스타일 적용
    body.style.position = 'fixed';
    body.style.top = `-${position.y}px`;
    body.style.left = `-${position.x}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.paddingRight = `${scrollbarWidth}px`;
    body.style.touchAction = 'none';
    body.style.overscrollBehavior = 'none';

    html.style.overflow = 'hidden';
    html.classList.add('xeg-scroll-locked');
    body.classList.add('xeg-scroll-locked');
  }

  /**
   * CSS 스크롤 잠금 해제 (강화된 버전)
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
    body.style.touchAction = '';
    body.style.overscrollBehavior = '';

    html.style.overflow = '';

    // CSS 변수 제거
    document.documentElement.style.removeProperty('--xeg-scroll-lock-top');
    document.documentElement.style.removeProperty('--xeg-scroll-lock-left');
    document.documentElement.style.removeProperty('--xeg-scrollbar-width');

    // 클래스 제거
    html.classList.remove('xeg-scroll-locked');
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

  /**
   * 안전한 스크롤 위치 복원 (private 메서드)
   */
  private restoreScrollPositionSafely(): void {
    const targetPosition = this.pageScrollState.savedPosition;

    // 첫 번째 시도: 즉시 복원
    window.scrollTo({
      left: targetPosition.x,
      top: targetPosition.y,
      behavior: 'instant',
    });

    // 100ms 후 검증
    setTimeout(() => {
      const currentX = window.scrollX || window.pageXOffset || 0;
      const currentY = window.scrollY || window.pageYOffset || 0;

      // 위치 차이가 5px 이상이면 복원 실패로 간주
      if (Math.abs(currentX - targetPosition.x) > 5 || Math.abs(currentY - targetPosition.y) > 5) {
        logger.warn('ScrollManager: 스크롤 위치 복원 실패, 강제 복원 시도', {
          target: targetPosition,
          current: { x: currentX, y: currentY },
        });

        // 강제 복원 시도
        this.forceRestoreScrollPosition();
      } else {
        logger.debug('ScrollManager: 스크롤 위치 복원 성공', {
          position: targetPosition,
        });
      }
    }, 100);
  }
}

// 전역 인스턴스 내보내기
export const scrollManager = ScrollManager.getInstance();
