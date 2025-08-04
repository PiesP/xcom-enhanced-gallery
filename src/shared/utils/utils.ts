/**
 * @fileoverview 유틸리티 모음
 * @description 유저스크립트에 적합한 간소화된 유틸리티 모음
 * @version 2.0.0 - Complexity Reduction & Modularization
 */

import { logger } from '@shared/logging/logger';
import { galleryState } from '@shared/state/signals/gallery.signals';

// ================================
// Re-exports from focused modules
// ================================

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

// CSS utilities (missing exports)
export { default as StyleManagerClass } from '../styles/StyleManager';
export { setCSSVariable } from '@shared/services/unified-style-service';

// Add combineClasses as a separate export using StyleManager
import StyleManager from '../styles/StyleManager';
export const combineClasses = StyleManager.combineClasses;

// Deduplication utilities
export { removeDuplicates } from './deduplication';

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

// Performance utilities (re-export from performance module, createDebouncer 제거)
export {
  Debouncer,
  rafThrottle,
  throttleScroll,
  measurePerformance,
  measureAsyncPerformance,
} from '@shared/services/unified-performance-service';

// ================================
// Gallery utilities (simplified functions)
// ================================

// 갤러리 요소 선택자들 (간소화)
const GALLERY_SELECTORS = [
  '.xeg-gallery-container',
  '[data-gallery-element]',
  '#xeg-gallery-root',
  '.vertical-gallery-view',
  '[data-xeg-gallery-container]',
];

// 비디오 컨트롤 선택자들 (간소화)
const VIDEO_CONTROL_SELECTORS = [
  '[data-testid="playButton"]',
  '[aria-label*="play"]',
  '[aria-label*="pause"]',
  '.video-player',
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
    return element.matches('.xeg-gallery-container, #xeg-gallery-root');
  } catch {
    return false;
  }
}

/**
 * 비디오 컨트롤 요소인지 확인
 */
export function isVideoControlElement(element: HTMLElement | null): boolean {
  if (!element) return false;

  return VIDEO_CONTROL_SELECTORS.some(selector => {
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
export function isGalleryInternalEvent(event: Event): boolean {
  return isGalleryInternalElement(event.target as HTMLElement);
}

/**
 * 갤러리 이벤트 차단 여부 확인
 */
export function shouldBlockGalleryEvent(event: Event): boolean {
  return isGalleryInternalEvent(event);
}
