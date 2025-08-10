/**
 * @fileoverview 유틸리티 모음
 * @description 유저스크립트에 적합한 간소화된 유틸리티 모음
 * @version 2.0.0 - Complexity Reduction & Modularization
 */

import { anyMatchOrClosest, isMatching } from '@shared/dom/predicates';
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

// CSS utilities (통합됨 - 중복 제거 완료, Phase 1.2)
export { default as StyleManagerClass } from '../styles/style-service';

/**
 * @deprecated Use consolidated styles module: import { setCSSVariable } from '@shared/utils/styles'
 */
export { setCSSVariable, getCSSVariable, setCSSVariables } from './styles';

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

// Performance utilities (통합된 성능 유틸리티)
export {
  debounce,
  throttle,
  rafThrottle,
  delay,
  measurePerformance,
  TimerService,
  globalTimerService,
  ResourceService,
  globalResourceService,
  registerResource,
  releaseResource,
  releaseAllResources,
  Performance,
} from './performance';

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
  return anyMatchOrClosest(element, GALLERY_SELECTORS);
}

/**
 * 갤러리 컨테이너인지 확인
 */
export function isGalleryContainer(element: HTMLElement | null): boolean {
  if (!element) return false;
  return isMatching(element, '.xeg-gallery-container, #xeg-gallery-root');
}

/**
 * 비디오 컨트롤 요소인지 확인
 */
export function isVideoControlElement(element: HTMLElement | null): boolean {
  if (!element) return false;
  return anyMatchOrClosest(element, VIDEO_CONTROL_SELECTORS);
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
