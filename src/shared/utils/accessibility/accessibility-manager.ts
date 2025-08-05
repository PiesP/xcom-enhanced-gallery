/**
 * @fileoverview AccessibilityManager - WCAG 2.1 준수 접근성 관리자
 * @description TDD로 구현된 접근성 기능 통합 관리
 * - ARIA 속성 관리
 * - 키보드 내비게이션
 * - 스크린 리더 지원
 * - 고대비/저시력 지원
 */

import {
  setAriaLabel,
  setAriaRole,
  createFocusTrap,
  enableKeyboardNavigation,
  addScreenReaderText,
  validateContrast,
} from './accessibility-utils';

/**
 * 접근성 설정 인터페이스
 */
export interface AccessibilityConfig {
  enableKeyboardNavigation: boolean;
  enableScreenReader: boolean;
  enableHighContrast: boolean;
  enableFocusTrap: boolean;
  announceChanges: boolean;
  validateContrast: boolean;
}

/**
 * 갤러리 접근성 상태
 */
export interface GalleryAccessibilityState {
  isKeyboardNavigable: boolean;
  hasScreenReaderSupport: boolean;
  hasFocusTrap: boolean;
  currentFocusIndex: number;
  totalItems: number;
}

/**
 * WCAG 2.1 준수 접근성 관리자
 * TDD 기반으로 구현된 통합 접근성 솔루션
 */
export class AccessibilityManager {
  private config: AccessibilityConfig;
  private readonly state: GalleryAccessibilityState;
  private readonly focusTrapsActive: Set<HTMLElement>;
  private readonly liveRegions: Map<string, HTMLElement>;

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = {
      enableKeyboardNavigation: true,
      enableScreenReader: true,
      enableHighContrast: false,
      enableFocusTrap: true,
      announceChanges: true,
      validateContrast: true,
      ...config,
    };

    this.state = {
      isKeyboardNavigable: false,
      hasScreenReaderSupport: false,
      hasFocusTrap: false,
      currentFocusIndex: 0,
      totalItems: 0,
    };

    this.focusTrapsActive = new Set();
    this.liveRegions = new Map();
  }

  /**
   * 갤러리 컨테이너에 접근성 기능 초기화
   * WCAG 2.4.1 Bypass Blocks
   */
  initializeGalleryAccessibility(galleryContainer: HTMLElement): void {
    if (!galleryContainer) {
      throw new Error('Gallery container is required for accessibility initialization');
    }

    // 1. ARIA 랜드마크 설정
    setAriaRole(galleryContainer, 'application');
    setAriaLabel(galleryContainer, '향상된 X.com 미디어 갤러리');
    galleryContainer.setAttribute('aria-describedby', 'gallery-instructions');

    // 2. 키보드 내비게이션 활성화
    if (this.config.enableKeyboardNavigation) {
      this.enableGalleryKeyboardNavigation(galleryContainer);
      this.state.isKeyboardNavigable = true;
    }

    // 3. 스크린 리더 지원
    if (this.config.enableScreenReader) {
      this.setupScreenReaderSupport(galleryContainer);
      this.state.hasScreenReaderSupport = true;
    }

    // 4. 포커스 트랩 설정
    if (this.config.enableFocusTrap) {
      this.createGalleryFocusTrap(galleryContainer);
      this.state.hasFocusTrap = true;
    }

    // 5. 사용 설명 추가
    this.addGalleryInstructions(galleryContainer);
  }

  /**
   * 갤러리 키보드 내비게이션 설정
   * WCAG 2.1.1 Keyboard
   */
  private enableGalleryKeyboardNavigation(container: HTMLElement): void {
    enableKeyboardNavigation(container);

    // 갤러리 전용 키보드 단축키
    container.addEventListener('keydown', event => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          this.navigateToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.navigateToNext();
          break;
        case 'Home':
          event.preventDefault();
          this.navigateToFirst();
          break;
        case 'End':
          event.preventDefault();
          this.navigateToLast();
          break;
        case 'Escape':
          event.preventDefault();
          this.closeGallery();
          break;
        case ' ':
        case 'Enter':
          event.preventDefault();
          this.togglePlayPause();
          break;
      }
    });
  }

  /**
   * 스크린 리더 지원 설정
   * WCAG 4.1.2 Name, Role, Value
   */
  private setupScreenReaderSupport(container: HTMLElement): void {
    // 라이브 영역 생성
    const statusRegion = this.createLiveRegion('gallery-status', 'polite');
    const alertRegion = this.createLiveRegion('gallery-alerts', 'assertive');

    container.appendChild(statusRegion);
    container.appendChild(alertRegion);

    // 현재 미디어 정보 표시 영역
    const mediaInfo = document.createElement('div');
    mediaInfo.id = 'current-media-info';
    mediaInfo.setAttribute('aria-live', 'polite');
    mediaInfo.setAttribute('aria-atomic', 'true');
    addScreenReaderText(mediaInfo, '현재 미디어 정보');
    container.appendChild(mediaInfo);
  }

  /**
   * 갤러리 포커스 트랩 생성
   * WCAG 2.4.3 Focus Order
   */
  private createGalleryFocusTrap(container: HTMLElement): void {
    createFocusTrap(container);
    this.focusTrapsActive.add(container);

    // 포커스 순서 관리
    const focusableElements = container.querySelectorAll(
      '[data-gallery-control], [data-media-item], button, [tabindex="0"]'
    );

    focusableElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      htmlElement.setAttribute('data-focus-index', index.toString());
    });
  }

  /**
   * 갤러리 사용 설명 추가
   * WCAG 3.3.2 Labels or Instructions
   */
  private addGalleryInstructions(_container: HTMLElement): void {
    const instructions = document.createElement('div');
    instructions.id = 'gallery-instructions';
    instructions.className = 'sr-only';
    instructions.innerHTML = `
      <h2>갤러리 사용법</h2>
      <p>방향키로 이미지 탐색, 스페이스바로 재생/정지, ESC로 갤러리 닫기</p>
      <p>Tab키로 컨트롤 이동, Enter로 버튼 활성화</p>
    `;

    document.body.appendChild(instructions);
  }

  /**
   * 라이브 영역 생성
   * WCAG 4.1.3 Status Messages
   */
  private createLiveRegion(id: string, politeness: 'polite' | 'assertive'): HTMLElement {
    const region = document.createElement('div');
    region.id = id;
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;

    this.liveRegions.set(id, region);
    return region;
  }

  /**
   * 미디어 변경 알림
   * WCAG 4.1.3 Status Messages
   */
  announceMediaChange(currentIndex: number, totalCount: number, mediaTitle?: string): void {
    if (!this.config.announceChanges) return;

    const message = mediaTitle
      ? `${currentIndex + 1}번째 미디어: ${mediaTitle}. 총 ${totalCount}개 중 ${currentIndex + 1}번째`
      : `${totalCount}개 중 ${currentIndex + 1}번째 미디어`;

    this.updateLiveRegion('gallery-status', message);
    this.state.currentFocusIndex = currentIndex;
    this.state.totalItems = totalCount;
  }

  /**
   * 갤러리 상태 변경 알림
   */
  announceGalleryStateChange(
    state: 'opened' | 'closed' | 'loading' | 'error',
    details?: string
  ): void {
    if (!this.config.announceChanges) return;

    let message = '';
    switch (state) {
      case 'opened':
        message = `갤러리가 열렸습니다. ${details || ''}`;
        break;
      case 'closed':
        message = '갤러리가 닫혔습니다.';
        break;
      case 'loading':
        message = '미디어를 불러오는 중입니다.';
        break;
      case 'error':
        message = `오류가 발생했습니다: ${details || '알 수 없는 오류'}`;
        break;
    }

    const regionId = state === 'error' ? 'gallery-alerts' : 'gallery-status';
    this.updateLiveRegion(regionId, message);
  }

  /**
   * 라이브 영역 업데이트
   */
  private updateLiveRegion(regionId: string, message: string): void {
    const region = this.liveRegions.get(regionId);
    if (region) {
      region.textContent = message;
    }
  }

  /**
   * 키보드 내비게이션 메서드들
   */
  private navigateToPrevious(): void {
    if (this.state.currentFocusIndex > 0) {
      this.state.currentFocusIndex--;
      this.announceMediaChange(this.state.currentFocusIndex, this.state.totalItems);
      // 실제 갤러리 이동 로직은 외부에서 주입
      this.emit('navigate:previous');
    }
  }

  private navigateToNext(): void {
    if (this.state.currentFocusIndex < this.state.totalItems - 1) {
      this.state.currentFocusIndex++;
      this.announceMediaChange(this.state.currentFocusIndex, this.state.totalItems);
      this.emit('navigate:next');
    }
  }

  private navigateToFirst(): void {
    this.state.currentFocusIndex = 0;
    this.announceMediaChange(this.state.currentFocusIndex, this.state.totalItems);
    this.emit('navigate:first');
  }

  private navigateToLast(): void {
    this.state.currentFocusIndex = this.state.totalItems - 1;
    this.announceMediaChange(this.state.currentFocusIndex, this.state.totalItems);
    this.emit('navigate:last');
  }

  private closeGallery(): void {
    this.announceGalleryStateChange('closed');
    this.emit('gallery:close');
  }

  private togglePlayPause(): void {
    this.emit('media:togglePlayPause');
  }

  /**
   * 이벤트 에미터 (간단한 구현)
   */
  private readonly eventListeners = new Map<string, Array<(data?: unknown) => void>>();

  on(event: string, callback: (data?: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * 접근성 상태 검증
   */
  validateAccessibility(container: HTMLElement): {
    isValid: boolean;
    issues: string[];
    score: number;
  } {
    const issues: string[] = [];

    // ARIA 속성 검증
    if (!container.getAttribute('role')) {
      issues.push('Missing ARIA role');
    }

    if (!container.getAttribute('aria-label') && !container.getAttribute('aria-labelledby')) {
      issues.push('Missing ARIA label');
    }

    // 키보드 접근성 검증
    if (container.tabIndex < 0 && !container.getAttribute('tabindex')) {
      issues.push('Element not keyboard accessible');
    }

    // 색상 대비 검증 (기본 요소만)
    if (this.config.validateContrast) {
      const textElements = container.querySelectorAll('p, span, button, a');
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element as HTMLElement);
        const isValidContrast = validateContrast(styles.color, styles.backgroundColor);
        if (!isValidContrast) {
          issues.push(`Poor color contrast in ${element.tagName}`);
        }
      });
    }

    const score = Math.max(0, 100 - issues.length * 20);
    return {
      isValid: issues.length === 0,
      issues,
      score,
    };
  }

  /**
   * 정리 메서드
   */
  cleanup(): void {
    // 포커스 트랩 해제
    this.focusTrapsActive.forEach(container => {
      const focusableElements = container.querySelectorAll('[tabindex]');
      focusableElements.forEach(el => {
        if (el.getAttribute('tabindex') === '0') {
          el.removeAttribute('tabindex');
        }
      });
    });

    // 라이브 영역 제거
    this.liveRegions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });

    // 사용 설명 제거
    const instructions = document.getElementById('gallery-instructions');
    instructions?.parentNode?.removeChild(instructions);

    this.focusTrapsActive.clear();
    this.liveRegions.clear();
    this.eventListeners.clear();
  }

  /**
   * 현재 접근성 상태 반환
   */
  getAccessibilityState(): GalleryAccessibilityState {
    return { ...this.state };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * 전역 접근성 관리자 인스턴스
 */
let globalAccessibilityManager: AccessibilityManager | null = null;

/**
 * 전역 접근성 관리자 반환
 */
export function getAccessibilityManager(): AccessibilityManager {
  if (!globalAccessibilityManager) {
    globalAccessibilityManager = new AccessibilityManager();
  }
  return globalAccessibilityManager;
}

/**
 * 접근성 관리자 초기화
 */
export function initializeAccessibility(
  config?: Partial<AccessibilityConfig>
): AccessibilityManager {
  globalAccessibilityManager = new AccessibilityManager(config);
  return globalAccessibilityManager;
}
