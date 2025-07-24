/**
 * @fileoverview Shared Utils - Phase 4 통합 완료
 * @version 4.0.0 - Utils 통합 및 중복 제거 완료
 */

// ================================
// Primary Unified Utils
// ================================

// 모든 핵심 유틸리티들을 통합한 파일에서 가져옵니다
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

// ================================
// Specialized Utils (유지)
// ================================

// Core DOM and accessibility utilities
export * from './core/accessibility';

// Essential media utilities
export * from './media';

// Pattern recognition utilities
export * from './patterns';

// CSS selector validation
export * from './css-selector-validator';

// Error handling (delegates to core)
export * from './error-handling';

// ================================
// Type Safety Helpers (from core)
// ================================

// Type safety utilities from infrastructure
export {
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
} from '@core/utils/type-safety-helpers';
