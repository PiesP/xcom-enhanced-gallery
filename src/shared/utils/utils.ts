/**
 * @fileoverview 유틸리티 모음
 * @description 유저스크립트에 적합한 간소화된 유틸리티 모음
 * @version 2.0.0 - Complexity Reduction & Modularization
 */

import { logger } from '../logging/logger';
import { galleryState } from '../state/signals/gallery.signals';
import {
  CSS as CSS_CONST,
  isVideoControlElement as isVideoControlElementCentral,
} from '../../constants';

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
export { ensureGalleryScrollAvailable, removeDuplicateStrings } from './core-utils';

// Deduplication utilities
export { removeDuplicates, removeDuplicateMediaItems } from './deduplication';

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
// Gallery utilities (simplified functions)
// ================================

// 갤러리 요소 선택자들 (상수화)
const GALLERY_SELECTORS = [
  `.${CSS_CONST.CLASSES.GALLERY_CONTAINER}`,
  '[data-gallery-element]',
  '.vertical-gallery-view',
  '[data-xeg-gallery-container]',
];

/**
 * 갤러리 트리거 가능 여부 확인
 */
export function canTriggerGallery(target: HTMLElement | null): boolean {
  if (!target) return false;

  // 갤러리가 이미 열려있으면 트리거하지 않음
  if (galleryState.value.isOpen) {
    return false;
  }

  // 비디오 컨트롤 요소인지 확인
  if (isVideoControlElement(target)) {
    return false;
  }

  // 갤러리 내부 요소인지 확인
  if (isGalleryInternalElement(target)) {
    return false;
  }

  return true;
}

/**
 * 갤러리 트리거 차단 여부 확인
 */
export function shouldBlockGalleryTrigger(target: HTMLElement | null): boolean {
  return !canTriggerGallery(target);
}

/**
 * 갤러리 내부 요소인지 확인
 */
export function isGalleryInternalElement(element: HTMLElement | null): boolean {
  if (!element) return false;

  return GALLERY_SELECTORS.some(selector => {
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
export function isGalleryContainer(element: HTMLElement | null): boolean {
  if (!element) return false;

  try {
    return (
      element.matches('.xeg-gallery-container') || element.matches('[data-xeg-gallery-container]')
    );
  } catch {
    return false;
  }
}

/**
 * 비디오 컨트롤 요소인지 확인
 */
export function isVideoControlElement(element: HTMLElement | null): boolean {
  if (!element) return false;
  return isVideoControlElementCentral(element);
}

/**
 * 갤러리 내부 이벤트인지 확인
 */
export function isGalleryInternalEvent(event: Event): boolean {
  return isGalleryInternalElement(event.target as HTMLElement);
}

/**
 * 갤러리 이벤트 차단 여부 확인
 */
export function shouldBlockGalleryEvent(event: Event): boolean {
  return isGalleryInternalEvent(event);
}
