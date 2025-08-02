/**
 * @fileoverview 핵심 유틸리티 export - Phase 2 통합 (30개)
 */

// === 핵심 유틸리티 (12개) ===
export {
  combineClasses,
  setCSSVariable,
  updateComponentState,
  removeDuplicates,
  rafThrottle,
  measurePerformance,
  throttleScroll,
  canTriggerGallery,
  isGalleryInternalElement,
  ensureGalleryScrollAvailable,
  findTwitterScrollContainer,
} from './utils';

// === 성능 관련 (1개) ===
export { createDebouncer } from './performance/performance-utils';

// === 최적화 유틸리티 ===
export * from './optimization/optimization-utils';

// === 타이머 관리 (2개) ===
export { TimerManager, globalTimerManager } from './timer-management';

// === 타입 안전 유틸리티 (4개) ===
export {
  safeParseInt,
  safeParseFloat,
  undefinedToNull,
  safeElementCheck,
} from './type-safety-helpers';

// === 핵심 DOM (3개) ===
export { safeQuerySelector, isInsideGallery, extractTweetInfoFromUrl } from './core-utils';

// === 접근성 및 이벤트 (5개) ===
export { getRelativeLuminance, parseColor, detectLightBackground } from './accessibility';
export { addListener, cleanupEventListeners } from './events';

// === 미디어 (1개) ===
export { imageFilter } from './media/image-filter';

// === DOM 배처 (2개) ===
export { DOMBatcher, globalDOMBatcher } from './dom/index';

// === 디버그 유틸리티 (1개) ===
export { galleryDebugUtils } from './debug/gallery-debug';
