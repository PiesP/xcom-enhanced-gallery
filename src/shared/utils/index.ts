/**
 * Shared Utils Barrel Export
 *
 * Phase 2B Step 2: Shared Layer 최적화
 * 핵심 유틸리티만 선별하여 export하고 의존성을 단순화합니다.
 */

// Core DOM and accessibility utilities
export * from './core';

// Essential media utilities
export * from './media';

// Pattern recognition utilities
export * from './patterns';

// Gallery-specific utilities
export * from './gallery';

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
export { InitializationGuard } from './InitializationGuard';
export { ToolbarTimerManager, toolbarTimers } from './ui/ToolbarTimerManager';
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
