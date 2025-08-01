/**
 * @fileoverview 핵심 유틸리티 export - 성능 최적화 완료 (44개)
 */

// === 기본 유틸리티 (13개) ===
export {
  combineClasses,
  toggleClass,
  setCSSVariable,
  updateComponentState,
  removeDuplicates,
  removeDuplicateStrings,
  removeDuplicateMediaItems,
  createDebouncer,
  rafThrottle,
  measurePerformance,
  throttleScroll,
  galleryDebugUtils,
  parseColor,
} from './utils';

// === 타이머 관리 (4개) ===
export {
  TimerManager,
  globalTimerManager,
  safePerformanceNow,
  createManagedDebounce,
} from './timer-management';

// === 타입 안전 유틸리티 (6개) ===
export {
  safeParseInt,
  safeParseFloat,
  undefinedToNull,
  stringWithDefault,
  safeElementCheck,
  safeTweetId,
} from './type-safety-helpers';

// === 핵심 유틸리티 (10개) ===
export {
  safeQuerySelector,
  isInsideGallery,
  ensureGalleryScrollAvailable,
  findTwitterScrollContainer,
  extractTweetInfoFromUrl,
  safeGetAttribute,
  safeSetAttribute,
} from './core-utils';

export { canTriggerGallery, isGalleryInternalElement, isGalleryContainer } from './utils';

// === 접근성 (2개) ===
export { detectLightBackground, getRelativeLuminance } from './accessibility';

// === 에러 처리 (4개) ===
export {
  standardizeError,
  getErrorMessage,
  isRetryableError,
  withFallback,
} from './error-handling';

// === 이벤트 (4개) ===
export {
  addListener,
  createCustomEvent,
  cleanupEventListeners,
  isClickableElement,
} from './events';

// === 미디어 (3개) ===
export { imageFilter, getHighQualityMediaUrl, MediaClickDetector } from './media';

// === DOM 배처 (2개) ===
export { DOMBatcher, globalDOMBatcher } from './dom/index';

// === 핵심 타입 (총 44개 export) ===
export type { DOMUpdate as DOMUpdateTask } from './dom/index';
export type { StandardError, ErrorContext } from './error-handling';
