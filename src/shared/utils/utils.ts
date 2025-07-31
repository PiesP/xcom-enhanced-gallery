/**
 * @fileoverview 유틸리티 모음
 * @description 유저스크립트에 적합한 간소화된 유틸리티 모음
 * @version 2.0.0 - Complexity Reduction & Modularization
 */

// ================================
// Re-exports from focused modules
// ================================

// Style utilities
export {
  combineClasses,
  toggleClass,
  setCSSVariable,
  setCSSVariables,
  updateComponentState,
  createThemedClassName,
} from './styles/css-utilities';

// Scroll utilities
export {
  createScrollHandler,
  findTwitterScrollContainer,
  isGalleryElement,
  createScrollDebouncer,
  preventScrollPropagation,
} from './scroll';

// Core utilities (from core-utils)
export { ensureGalleryScrollAvailable } from './core-utils';

// Deduplication utilities
export {
  removeDuplicates,
  removeDuplicateStrings,
  removeDuplicateMediaItems,
} from './deduplication';

// Debug utilities
export { galleryDebugUtils } from './debug/gallery-debug';

// Accessibility utilities
export {
  getRelativeLuminance,
  parseColor,
  calculateContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  detectActualBackgroundColor,
  detectLightBackground,
} from './accessibility';

// Performance utilities (re-export from performance module)
export {
  createDebouncer,
  Debouncer,
  rafThrottle,
  throttleScroll,
  measurePerformance,
  measureAsyncPerformance,
} from './performance/performance-utils';

// ================================
// Gallery utilities
// ================================

import { logger } from '@shared/logging/logger';
import { galleryState } from '@shared/state/signals/gallery.signals';

/**
 * 갤러리 유틸리티 클래스 (간소화된 버전)
 */
export class GalleryUtils {
  // 갤러리 요소 선택자들 (간소화)
  private static readonly GALLERY_SELECTORS = [
    '.xeg-gallery-container',
    '[data-gallery-element]',
    '#xeg-gallery-root',
    '.vertical-gallery-view',
    '[data-xeg-gallery-container]',
  ];

  // 비디오 컨트롤 선택자들 (간소화)
  private static readonly VIDEO_CONTROL_SELECTORS = [
    '[data-testid="playButton"]',
    '[aria-label*="play"]',
    '[aria-label*="pause"]',
    '.video-player',
  ];

  /**
   * 갤러리 트리거 가능 여부 확인
   */
  static canTriggerGallery(target: HTMLElement | null): boolean {
    if (!target) return false;

    // 갤러리가 이미 열려있으면 트리거하지 않음
    if (galleryState.value.isOpen) {
      return false;
    }

    // 비디오 컨트롤 요소인지 확인
    if (this.isVideoControlElement(target)) {
      return false;
    }

    // 갤러리 내부 요소인지 확인
    if (this.isGalleryInternalElement(target)) {
      return false;
    }

    return true;
  }

  /**
   * 갤러리 트리거 차단 여부 확인
   */
  static shouldBlockGalleryTrigger(target: HTMLElement | null): boolean {
    return !this.canTriggerGallery(target);
  }

  /**
   * 갤러리 내부 요소인지 확인
   */
  static isGalleryInternalElement(element: HTMLElement | null): boolean {
    if (!element) return false;

    return this.GALLERY_SELECTORS.some(selector => {
      try {
        return element.matches(selector) || element.closest(selector) !== null;
      } catch (error) {
        logger.warn('Invalid selector:', selector, error);
        return false;
      }
    });
  }

  /**
   * 갤러리 컨테이너인지 확인
   */
  static isGalleryContainer(element: HTMLElement | null): boolean {
    if (!element) return false;

    try {
      return element.matches('.xeg-gallery-container, #xeg-gallery-root');
    } catch {
      return false;
    }
  }

  /**
   * 비디오 컨트롤 요소인지 확인
   */
  static isVideoControlElement(element: HTMLElement | null): boolean {
    if (!element) return false;

    return this.VIDEO_CONTROL_SELECTORS.some(selector => {
      try {
        return element.matches(selector) || element.closest(selector) !== null;
      } catch (error) {
        logger.warn('Invalid video control selector:', selector, error);
        return false;
      }
    });
  }

  /**
   * 갤러리 내부 이벤트인지 확인
   */
  static isGalleryInternalEvent(event: Event): boolean {
    return this.isGalleryInternalElement(event.target as HTMLElement);
  }

  /**
   * 갤러리 이벤트 차단 여부 확인
   */
  static shouldBlockGalleryEvent(event: Event): boolean {
    return this.isGalleryInternalEvent(event);
  }
}

// 편의 함수들 (GalleryUtils 메서드들의 직접 export)
export const {
  canTriggerGallery,
  shouldBlockGalleryTrigger,
  isGalleryInternalElement,
  isGalleryContainer,
  isVideoControlElement,
  isGalleryInternalEvent,
  shouldBlockGalleryEvent,
} = GalleryUtils;
