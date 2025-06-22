/**
 * Gallery Scroll Protection Service
 * 갤러리 전용 스크롤 보호 서비스 - Clean Architecture 원칙 준수
 *
 * @description 갤러리 열기 시 배경 페이지 스크롤을 즉시 잠그고
 * 갤러리 닫기 시 정확히 복원하는 핵심 비즈니스 로직을 담당합니다.
 * 기존 UnifiedScrollManager와 통합하여 일관성을 유지합니다.
 */

import { SERVICE_KEYS } from '@core/constants';
import { getService } from '@core/services/ServiceRegistry';
import { logger } from '@infrastructure/logging/logger';

export interface GalleryScrollState {
  readonly isLocked: boolean;
  readonly savedPosition: { top: number; left: number };
  readonly lockTimestamp: number;
}

export interface ScrollProtectionOptions {
  readonly immediatePreventDefault?: boolean;
  readonly preventBackgroundInteraction?: boolean;
  readonly enableDebugLogging?: boolean;
}

/**
 * 갤러리 스크롤 보호 서비스
 *
 * 핵심 비즈니스 로직:
 * 1. 갤러리 열기 시 즉시 배경 스크롤 잠금
 * 2. 모든 스크롤 이벤트 방지
 * 3. 갤러리 닫기 시 정확한 위치 복원
 * 4. 기존 UnifiedScrollManager와 통합
 */
export class GalleryScrollProtectionService {
  private static instance: GalleryScrollProtectionService;
  private currentState: GalleryScrollState = {
    isLocked: false,
    savedPosition: { top: 0, left: 0 },
    lockTimestamp: 0,
  };

  private readonly preventScrollHandler: (event: Event) => void;
  private readonly preventWheelHandler: (event: WheelEvent) => void;
  private readonly preventKeyboardHandler: (event: KeyboardEvent) => void;
  private readonly preventTouchHandler: (event: TouchEvent) => void;

  private scrollManager: import('@infrastructure/dom/ScrollLockService').ScrollLockService | null =
    null;

  private options: ScrollProtectionOptions = {
    immediatePreventDefault: true,
    preventBackgroundInteraction: true,
    enableDebugLogging: true,
  };

  private constructor() {
    this.preventScrollHandler = this.handlePreventScroll.bind(this);
    this.preventWheelHandler = this.handlePreventWheel.bind(this);
    this.preventKeyboardHandler = this.handlePreventKeyboard.bind(this);
    this.preventTouchHandler = this.handlePreventTouch.bind(this);
  }

  public static getInstance(): GalleryScrollProtectionService {
    if (!GalleryScrollProtectionService.instance) {
      GalleryScrollProtectionService.instance = new GalleryScrollProtectionService();
    }
    return GalleryScrollProtectionService.instance;
  }

  /**
   * 갤러리 열기 시 즉시 스크롤 보호 적용
   *
   * @param options 스크롤 보호 옵션
   * @returns 갤러리 스크롤 상태
   */
  public async protectGalleryScroll(
    options?: ScrollProtectionOptions
  ): Promise<GalleryScrollState> {
    try {
      if (this.currentState.isLocked) {
        if (options?.enableDebugLogging ?? this.options.enableDebugLogging) {
          logger.debug('GalleryScrollProtection: Already protected');
        }
        return this.currentState;
      }

      // 옵션 병합
      this.options = { ...this.options, ...options };

      // 기존 스크롤 매니저 가져오기
      this.scrollManager ??= await getService(SERVICE_KEYS.PAGE_SCROLL_LOCK);

      // 현재 스크롤 위치 즉시 저장
      const currentPosition = {
        top: window.pageYOffset || document.documentElement.scrollTop || 0,
        left: window.pageXOffset || document.documentElement.scrollLeft || 0,
      };

      // 즉시 스크롤 잠금 적용 (기존 서비스 활용)
      this.applyImmediateScrollLock(currentPosition);

      // 포괄적인 스크롤 이벤트 방지
      this.addComprehensiveScrollPrevention();

      // 기존 UnifiedScrollManager도 호출하여 일관성 유지
      if (this.scrollManager?.lockPageScroll) {
        this.scrollManager.lockPageScroll();
      }

      this.currentState = {
        isLocked: true,
        savedPosition: currentPosition,
        lockTimestamp: Date.now(),
      };

      if (this.options.enableDebugLogging) {
        logger.debug('GalleryScrollProtection: Scroll protection applied', {
          savedPosition: currentPosition,
          timestamp: this.currentState.lockTimestamp,
          options: this.options,
        });
      }

      return this.currentState;
    } catch (error) {
      logger.error('GalleryScrollProtection: Failed to protect scroll', error);
      return {
        isLocked: false,
        savedPosition: { top: 0, left: 0 },
        lockTimestamp: 0,
      };
    }
  }

  /**
   * 갤러리 닫기 시 스크롤 보호 해제 및 복원
   */
  public async unprotectGalleryScroll(): Promise<void> {
    try {
      if (!this.currentState.isLocked) {
        if (this.options.enableDebugLogging) {
          logger.debug('GalleryScrollProtection: Not protected');
        }
        return;
      }

      // 모든 스크롤 이벤트 리스너 제거
      this.removeComprehensiveScrollPrevention();

      // 기존 스크롤 매니저로 복원
      if (this.scrollManager?.unlockPageScroll) {
        this.scrollManager.unlockPageScroll();
      } else {
        // 직접 복원 (fallback)
        this.performDirectRestore();
      }

      // 상태 리셋
      this.currentState = {
        isLocked: false,
        savedPosition: { top: 0, left: 0 },
        lockTimestamp: 0,
      };

      if (this.options.enableDebugLogging) {
        logger.debug('GalleryScrollProtection: Scroll protection removed');
      }
    } catch (error) {
      logger.error('GalleryScrollProtection: Failed to unprotect scroll', error);
      // 에러 발생 시 강제 복원
      this.forceRestore();
    }
  }

  /**
   * 현재 보호 상태 반환
   */
  public getProtectionState(): GalleryScrollState {
    return { ...this.currentState };
  }

  /**
   * 강제 복원 (에러 복구용)
   */
  public forceRestore(): void {
    try {
      this.removeComprehensiveScrollPrevention();
      this.performDirectRestore();

      this.currentState = {
        isLocked: false,
        savedPosition: { top: 0, left: 0 },
        lockTimestamp: 0,
      };

      logger.warn('GalleryScrollProtection: Force restored');
    } catch (error) {
      logger.error('GalleryScrollProtection: Force restore failed', error);
    }
  }

  /**
   * 즉시 스크롤 잠금 적용 (DOM 직접 조작)
   */
  private applyImmediateScrollLock(position: { top: number; left: number }): void {
    const body = document.body;
    const documentElement = document.documentElement;

    // 즉시 CSS 스크롤 잠금
    body.style.position = 'fixed';
    body.style.top = `-${position.top}px`;
    body.style.left = `-${position.left}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    // document element도 잠금
    documentElement.style.overflow = 'hidden';

    logger.debug('GalleryScrollProtection: Immediate scroll lock applied');
  }

  /**
   * 직접 복원 (fallback)
   */
  private performDirectRestore(): void {
    const body = document.body;
    const documentElement = document.documentElement;
    const { savedPosition } = this.currentState;

    // 스타일 복원
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.width = '';
    body.style.overflow = '';
    documentElement.style.overflow = '';

    // 스크롤 위치 복원
    window.scrollTo({
      top: savedPosition.top,
      left: savedPosition.left,
      behavior: 'auto', // 즉시 복원
    });

    logger.debug('GalleryScrollProtection: Direct restore completed', savedPosition);
  }

  /**
   * 포괄적인 스크롤 방지 이벤트 리스너 추가
   */
  private addComprehensiveScrollPrevention(): void {
    const options = { passive: false, capture: true };

    // 기본 스크롤 이벤트들
    window.addEventListener('scroll', this.preventScrollHandler, options);
    window.addEventListener('wheel', this.preventWheelHandler, options);
    window.addEventListener('touchmove', this.preventTouchHandler, options);

    // 키보드 스크롤 방지 (화살표, Page Up/Down 등)
    if (this.options.preventBackgroundInteraction) {
      document.addEventListener('keydown', this.preventKeyboardHandler, options);
    }

    if (this.options.enableDebugLogging) {
      logger.debug('GalleryScrollProtection: Comprehensive scroll prevention enabled');
    }
  }

  /**
   * 포괄적인 스크롤 방지 이벤트 리스너 제거
   */
  private removeComprehensiveScrollPrevention(): void {
    window.removeEventListener('scroll', this.preventScrollHandler);
    window.removeEventListener('wheel', this.preventWheelHandler);
    window.removeEventListener('touchmove', this.preventTouchHandler);
    document.removeEventListener('keydown', this.preventKeyboardHandler);

    if (this.options.enableDebugLogging) {
      logger.debug('GalleryScrollProtection: Comprehensive scroll prevention disabled');
    }
  }

  /**
   * 스크롤 이벤트 방지 핸들러
   */
  private handlePreventScroll(event: Event): void {
    if (this.currentState.isLocked && this.isBackgroundElement(event.target as Element)) {
      if (this.options.immediatePreventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  /**
   * 휠 이벤트 방지 핸들러
   */
  private handlePreventWheel(event: WheelEvent): void {
    if (this.currentState.isLocked && this.isBackgroundElement(event.target as Element)) {
      if (this.options.immediatePreventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  /**
   * 키보드 이벤트 방지 핸들러 (스크롤 관련 키들)
   */
  private handlePreventKeyboard(event: KeyboardEvent): void {
    if (!this.currentState.isLocked || !this.options.preventBackgroundInteraction) {
      return;
    }

    const scrollKeys = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'PageUp',
      'PageDown',
      'Home',
      'End',
      'Space',
    ];

    if (scrollKeys.includes(event.key) && this.isBackgroundElement(event.target as Element)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * 터치 이벤트 방지 핸들러
   */
  private handlePreventTouch(event: TouchEvent): void {
    if (this.currentState.isLocked && this.isBackgroundElement(event.target as Element)) {
      if (this.options.immediatePreventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  /**
   * 배경 요소인지 확인 (갤러리 외부 요소)
   */
  private isBackgroundElement(element: Element | null): boolean {
    if (!element) return true;

    // 갤러리 컨테이너 확인
    const gallerySelectors = [
      '[data-gallery-container]',
      '.xeg-gallery',
      '.xeg-vertical-gallery',
      '.xeg-media-viewer',
    ];

    return !gallerySelectors.some(selector => element.closest(selector) !== null);
  }
}

/**
 * 싱글톤 인스턴스 반환 함수
 */
export function getGalleryScrollProtectionService(): GalleryScrollProtectionService {
  return GalleryScrollProtectionService.getInstance();
}
