/**
 * @fileoverview 핵심 유틸리티 export - 성능 최적화 완료 (57개 + component utils)
 * @version 2.1.0 - services에서 이동된 유틸리티 추가
 */

// === 기본 유틸리티 (12개) - galleryDebugUtils removed in Phase 140.2 ===
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

// === Type Guard 함수 (10개) ===
export {
  createEventListener,
  isHTMLElement,
  isHTMLImageElement,
  isHTMLVideoElement,
  isHTMLAnchorElement,
  isWheelEvent,
  isKeyboardEvent,
  isMouseEvent,
  hasElement,
  isArray,
  isRecord,
  isAbortSignal,
  createAddEventListenerOptions,
} from './type-guards';

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

// === 이벤트 (1개) ===
export { addListener } from './events';

// === 미디어 (6개) ===
export {
  imageFilter,
  getHighQualityMediaUrl,
  detectMediaFromClick,
  findMediaAtCoordinates,
  isProcessableMedia,
  shouldBlockMediaTrigger,
} from './media';

// === DOM 배처 (2개) ===
export { DOMBatcher, globalDOMBatcher } from './dom/index';

// === 브라우저 환경 안전 접근 (11개) - Phase 194: 추가 ===
export {
  isBrowserEnvironment,
  safeWindow,
  safeLocation,
  safeNavigator,
  isTwitterSite,
  getCurrentUrlInfo,
  setScrollPosition,
  safeSetTimeout,
  safeClearTimeout,
  getViewportSize,
  getDevicePixelRatio,
  matchesMediaQuery,
  isDarkMode,
  prefersReducedMotion,
  getBrowserInfo,
  isExtensionContext,
  isExtensionEnvironment,
} from './browser';

// === 컴포넌트 유틸리티 (8개) - Phase 2-3A: 추가 ===
export {
  createClassName,
  createAriaProps,
  createTestProps,
  handleLoadingState,
  mergeProps,
  validateProps,
  type ValidationResult,
} from './component-utils';

// === UI 유틸리티 (3개) - services에서 이동 ===
export {
  evaluateHighContrast,
  HighContrastDetector,
  type HighContrastDetectionInput,
} from './high-contrast';

export {
  createStabilityDetector,
  type StabilityDetector,
  type StabilityConfig,
  type StabilityMetrics,
  type ActivityType,
  type IStabilityDetector,
} from './stability';

// === 핵심 타입 (총 44개 export) ===
export type { DOMUpdate as DOMUpdateTask } from './dom/index';
export type { StandardError, ErrorContext, ErrorFactoryContext } from './error-handling';
export { ErrorSeverity, ErrorCategory, ErrorFactory } from './error-handling';
