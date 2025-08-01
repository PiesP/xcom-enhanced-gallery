/**
 * @fileoverview 핵심 유틸리티 export - Phase 4 간소화 (45개로 최적화)
 */

// === 기본 유틸리티 (15개) ===
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
  getRelativeLuminance,
  detectLightBackground,
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

// === 핵심 유틸리티 (7개) ===
export {
  safeQuerySelector,
  isInsideGallery,
  ensureGalleryScrollAvailable,
  findTwitterScrollContainer,
  extractTweetInfoFromUrl,
  safeGetAttribute,
  safeSetAttribute,
} from './core-utils';

// === 에러 처리 (4개) ===
export {
  standardizeError,
  getErrorMessage,
  isRetryableError,
  withFallback,
} from './error-handling';

// === 이벤트 (6개) ===
export {
  addListener,
  createCustomEvent,
  cleanupEventListeners,
  removeAllEventListeners,
  isClickableElement,
  isMediaElement,
} from './events';

// === 미디어 (4개) ===
export { imageFilter, getHighQualityMediaUrl, isValidMediaUrl, MediaClickDetector } from './media';

// === DOM 배처 (2개) ===
export { DOMBatcher, globalDOMBatcher } from './dom/index';

// === 핵심 타입 (총 45개 export) ===
export type { DOMUpdate as DOMUpdateTask } from './dom/index';
export type { StandardError, ErrorContext } from './error-handling';
