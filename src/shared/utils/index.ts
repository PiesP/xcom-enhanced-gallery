/**
 * Shared Utils Barrel Export
 *
 * Phase 4: Utils 및 Helper 단순화
 * 핵심 유틸리티만 선별하여 export하고 중복을 제거합니다.
 */

// Core DOM and accessibility utilities (excluding gallery functions)
export * from './core/accessibility';

// Essential media utilities
export * from './media';

// Pattern recognition utilities
export * from './patterns';

// Gallery-specific utilities (includes isInsideGallery functions)
export * from './gallery-utils';

// Performance utilities (throttle, debounce, monitoring)
export * from './performance';

// Common utilities (deduplication, type safety helpers)
export * from './common';

// Performance utilities (throttle, debounce, monitoring)
export * from './performance';

// Common utilities (deduplication, type safety helpers)
export * from './common';

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

// Specialized utilities
export * from './css-selector-validator';

// Scroll utilities
export {
  createScrollHandler,
  preventScrollPropagation,
  findTwitterScrollContainer,
  isGalleryElement,
  createScrollDebouncer,
} from './scroll';

// Error handling (delegates to core)
export * from './error-handling';

// Style utilities
export * from './styles';

// Debug utilities
export * from './debug/gallery-debug';
