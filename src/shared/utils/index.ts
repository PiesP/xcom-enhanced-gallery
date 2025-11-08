/**
 * @fileoverview Core utilities export - performance optimized (57+ component utils)
 * @version 2.1.0 - Added utilities moved from services
 */

// === Basic utilities (Phase 326.7: Removed duplicates) ===
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
  throttleScroll,
} from './utils';

// === Timer management (4) ===
export {
  TimerManager,
  globalTimerManager,
  safePerformanceNow,
  createManagedDebounce,
} from './timer-management';

// === Type-safe utilities (6) ===
export {
  safeParseInt,
  safeParseFloat,
  undefinedToNull,
  stringWithDefault,
  safeElementCheck,
  safeTweetId,
} from './type-safety-helpers';

// === Type Guard functions (10) ===
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

// === Core utilities (Phase 326.7: Reduced to 3, removed unused functions) ===
export { ensureGalleryScrollAvailable, isGalleryInternalEvent } from './core-utils';

export { canTriggerGallery, isGalleryInternalElement } from './utils';

// === Error handling (1) ===
export { getErrorMessage } from './error-handling';

// === Events (1) ===
export { addListener } from './events';

// === Media (5) ===
export {
  getHighQualityMediaUrl,
  detectMediaFromClick,
  findMediaAtCoordinates,
  isProcessableMedia,
  shouldBlockMediaTrigger,
} from './media';

// === DOM Batcher (2) ===
export { DOMBatcher, globalDOMBatcher } from './dom/index';

// === Browser environment safe access (11) - Phase 194: Added ===
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

// === Component utilities (4) - Phase 2-3A: Added ===
export { createClassName, createAriaProps, createTestProps, mergeProps } from './component-utils';

// === UI utilities (3) - Moved from services ===
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

// === Listener profiling (Phase 420.3) ===
// === Core types (total 44 exports) ===
export type { DOMUpdate as DOMUpdateTask } from './dom/index';
