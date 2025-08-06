/**
 * @fileoverview AccessibilityService - WCAG 2.1 준수 접근성 서비스
 */

import {
  setAriaLabel,
  setAriaRole,
  createFocusTrap,
  enableKeyboardNavigation,
} from './accessibility-utils';

export interface AccessibilityConfig {
  enableKeyboardNavigation: boolean;
  enableScreenReader: boolean;
  enableHighContrast: boolean;
  enableFocusTrap: boolean;
  announceChanges: boolean;
  validateContrast: boolean;
}

export interface GalleryAccessibilityState {
  isKeyboardNavigable: boolean;
  hasScreenReaderSupport: boolean;
  hasFocusTrap: boolean;
  currentFocusIndex: number;
  totalItems: number;
}

export class AccessibilityService {
  private config: AccessibilityConfig;
  private readonly state: GalleryAccessibilityState;

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
  }

  initializeGalleryAccessibility(galleryContainer: HTMLElement): void {
    if (!galleryContainer) {
      throw new Error('Gallery container is required');
    }

    setAriaRole(galleryContainer, 'application');
    setAriaLabel(galleryContainer, '향상된 X.com 미디어 갤러리');

    if (this.config.enableKeyboardNavigation) {
      enableKeyboardNavigation(galleryContainer);
      this.state.isKeyboardNavigable = true;
    }

    if (this.config.enableFocusTrap) {
      createFocusTrap(galleryContainer);
      this.state.hasFocusTrap = true;
    }
  }

  getAccessibilityState(): GalleryAccessibilityState {
    return { ...this.state };
  }

  updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

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

    // Simple console announcement for now
    console.info('[Accessibility]', message);
  }
}

let globalAccessibilityManager: AccessibilityService | null = null;

export function getAccessibilityManager(): AccessibilityService {
  if (!globalAccessibilityManager) {
    globalAccessibilityManager = new AccessibilityService();
  }
  return globalAccessibilityManager;
}

export function initializeAccessibility(
  config?: Partial<AccessibilityConfig>
): AccessibilityService {
  globalAccessibilityManager = new AccessibilityService(config);
  return globalAccessibilityManager;
}
