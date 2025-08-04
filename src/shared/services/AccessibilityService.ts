/**
 * @fileoverview 접근성 서비스
 * @description TDD 기반 Manager → Service 네이밍 통일
 * @version 2.0.0
 */

import { logger } from '@shared/logging/logger';

/**
 * 접근성 설정 인터페이스
 */
export interface AccessibilityConfig {
  enableFocusManagement: boolean;
  enableKeyboardNavigation: boolean;
  enableAriaLabels: boolean;
  enableScreenReaderSupport: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
}

/**
 * 갤러리 접근성 상태
 */
export interface GalleryAccessibilityState {
  currentFocusIndex: number;
  totalItems: number;
  isModalOpen: boolean;
  lastFocusedElement: HTMLElement | null;
}

/**
 * 접근성 서비스
 * 갤러리의 접근성 기능을 관리합니다
 */
export class AccessibilityService {
  private config: AccessibilityConfig;
  private readonly state: GalleryAccessibilityState;
  private readonly focusTrapsActive: Set<HTMLElement>;
  private readonly liveRegions: Map<string, HTMLElement>;

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = {
      enableFocusManagement: true,
      enableKeyboardNavigation: true,
      enableAriaLabels: true,
      enableScreenReaderSupport: true,
      highContrastMode: false,
      reducedMotion: false,
      ...config,
    };

    this.state = {
      currentFocusIndex: 0,
      totalItems: 0,
      isModalOpen: false,
      lastFocusedElement: null,
    };

    this.focusTrapsActive = new Set();
    this.liveRegions = new Map();
  }

  /**
   * 접근성 서비스 초기화
   */
  initialize(): void {
    if (this.config.enableScreenReaderSupport) {
      this.createLiveRegions();
    }

    if (this.config.enableKeyboardNavigation) {
      this.setupKeyboardNavigation();
    }
  }

  /**
   * 포커스 트랩 생성
   */
  createFocusTrap(container: HTMLElement): void {
    if (!this.config.enableFocusManagement) return;

    this.focusTrapsActive.add(container);
    container.setAttribute('tabindex', '-1');
    container.focus();
  }

  /**
   * 포커스 트랩 해제
   */
  releaseFocusTrap(container: HTMLElement): void {
    this.focusTrapsActive.delete(container);

    if (this.state.lastFocusedElement) {
      this.state.lastFocusedElement.focus();
      this.state.lastFocusedElement = null;
    }
  }

  /**
   * 라이브 리전 생성
   */
  private createLiveRegions(): void {
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.className = 'xeg-sr-only';
    document.body.appendChild(politeRegion);
    this.liveRegions.set('polite', politeRegion);

    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'xeg-sr-only';
    document.body.appendChild(assertiveRegion);
    this.liveRegions.set('assertive', assertiveRegion);
  }

  /**
   * 스크린 리더에 메시지 전달
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.enableScreenReaderSupport) return;

    const region = this.liveRegions.get(priority);
    if (region) {
      region.textContent = message;

      // 메시지 클리어 (중복 방지)
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  /**
   * 키보드 네비게이션 설정
   */
  private setupKeyboardNavigation(): void {
    // 키보드 이벤트 리스너 설정은 구체적인 컴포넌트에서 처리
    logger.debug('Keyboard navigation enabled');
  }

  /**
   * 갤러리 상태 업데이트
   */
  updateGalleryState(totalItems: number, currentIndex: number): void {
    this.state.totalItems = totalItems;
    this.state.currentFocusIndex = currentIndex;
  }

  /**
   * 모달 상태 설정
   */
  setModalState(isOpen: boolean, lastFocusedElement?: HTMLElement): void {
    this.state.isModalOpen = isOpen;

    if (isOpen && lastFocusedElement) {
      this.state.lastFocusedElement = lastFocusedElement;
    } else if (!isOpen) {
      this.state.lastFocusedElement = null;
    }
  }

  /**
   * 접근성 서비스 정리
   */
  cleanup(): void {
    // 라이브 리전 제거
    this.liveRegions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
    this.liveRegions.clear();

    // 포커스 트랩 해제
    this.focusTrapsActive.clear();

    logger.debug('AccessibilityService cleanup completed');
  }

  /**
   * 현재 상태 반환
   */
  getState(): GalleryAccessibilityState {
    return { ...this.state };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
