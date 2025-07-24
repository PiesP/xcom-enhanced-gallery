/**
 * @fileoverview Shared Utils - Phase 3 통합 완료
 * @version 3.0.0 - Utils 단순화 및 통합 완료
 *
 * 5개 통합 파일로 단순화:
 * - unified-utils.ts (성능, 스타일, 스크롤, 디버그)
 * - dom-utils.ts (DOM 조작, 갤러리 감지, 안전한 DOM 접근)
 * - core-utils.ts (접근성, 타입 안전성, 에러 처리)
 * - media/ (미디어 전용 로직)
 * - patterns/ (URL 패턴 매칭)
 */

// ================================
// 통합된 핵심 유틸리티들
// ================================

// Performance, Style, Scroll, Debug utilities
export {
  // Performance utilities
  Debouncer,
  createDebouncer,
  rafThrottle,
  throttleScroll,
  measurePerformance,
  measureAsyncPerformance,

  // Style utilities
  combineClasses,
  toggleClass,
  setCSSVariable,
  setCSSVariables,
  updateComponentState,
  createThemedClassName,

  // Scroll utilities
  createScrollHandler,
  findTwitterScrollContainer,
  isGalleryElement,
  createScrollDebouncer,
  ensureGalleryScrollAvailable,
  preventScrollPropagation,

  // Deduplication utilities
  removeDuplicates,
  removeDuplicateStrings,
  removeDuplicateMediaItems,

  // Debug utilities
  galleryDebugUtils,

  // Unified export object
  unifiedUtils,
} from './unified-utils';

// DOM utilities (통합된 파일)
export {
  // 갤러리 요소 감지
  isInsideGallery,
  isGalleryContainer,
  isGalleryInternalEvent,
  shouldBlockGalleryEvent,

  // 안전한 DOM 접근
  safeQuerySelector,
  safeQuerySelectorAll,
  createIntersectionObserver,
  createMutationObserver,
  safeGetAttribute,
  safeSetAttribute,
  safeAddClass,
  safeRemoveClass,
  safeSetStyle,
  safeRemoveElement,
  safeAddEventListener,
  safeRemoveEventListener,
  isElementConnected,
  safeGetBoundingClientRect,
} from './dom-utils';

// Core utilities (통합된 파일)
export {
  // 접근성 유틸리티
  getRelativeLuminance,
  parseColor,
  calculateContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  detectActualBackgroundColor,
  detectLightBackground,

  // 타입 안전성 헬퍼들
  safeParseInt,
  safeParseFloat,
  safeArrayGet,
  safeNodeListAccess,
  safeMatchExtract,
  safeCall,
  safeEventHandler,
  undefinedToNull,
  nullToUndefined,
  stringWithDefault,
  safeElementCheck,
  safeProp,
  safeTweetId,
  safeUsername,
  safeClickedIndex,
  assignOptionalProperty,
  conditionalAssign,
  mergeWithoutUndefined,
  createWithOptionalProperties,
  buildSafeObject,
  removeUndefinedProperties,

  // 에러 처리
  safeAsync,
  safeSync,
  handleError,
  type SafeOperationResult,
} from './core-utils';

// ================================
// 전문화된 유틸리티들 (유지)
// ================================

// Essential media utilities
export * from './media';

// Pattern recognition utilities
export * from './patterns';

// CSS selector validation
export * from './css-selector-validator';

// Event coordination (중요한 기능이므로 유지)
export * from './events';
