/**
 * @fileoverview Shared Utils - Phase 3 통합 완료
 * @version 3.0.0 - 이벤트 시스템 및 유틸리티 단순화 완료
 *
 * 새로운 구조:
 * - event-dispatcher.ts (단순화된 이벤트 관리)
 * - event-utils.ts (갤러리 이벤트 조정)
 * - selector-utils.ts (CSS 선택자 검증)
 * - dom-utils.ts (DOM 조작 및 안전한 접근)
 * - unified-utils.ts (통합 유틸리티)
 * - resource-manager.ts (리소스 관리)
 */

// ================================
// 이벤트 관리 시스템 (새로 단순화됨)
// ================================

// 단순화된 이벤트 디스패처
export {
  addEventListenerManaged,
  addMultipleEventListeners,
  removeEventListenerManaged,
  removeEventListenersByContext,
  removeEventListenersByType,
  removeAllEventListeners,
  getEventListenerStatus,
  cleanupEventDispatcher,
  EventDispatcher,
} from './event-dispatcher';

// 갤러리 이벤트 조정
export {
  initializeGalleryEvents,
  cleanupGalleryEvents,
  getGalleryEventStatus,
  updateGalleryEventOptions,
  GalleryEventCoordinator,
  type EventHandlers,
  type GalleryEventOptions,
} from './event-utils';

// CSS 선택자 검증 및 분석
export {
  isValidCSSSelector,
  parseAttributeSelector,
  findFirstMatchingSelector,
  calculateSelectorComplexity,
  hasPerformanceIssues,
  calculateSelectorSpecificity,
  compareSelectorSpecificity,
} from './selector-utils';

// ================================
// 기존 통합 유틸리티들
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

// Resource management utilities
export {
  createManagedTimer,
  createManagedInterval,
  addManagedEventListener,
  createManagedObserver,
  createManagedController,
  createManagedObjectURL,
  registerManagedMemoryResource,
  releaseResource,
  releaseResourcesByContext,
  releaseResourcesByType,
  cleanupAllResources,
  getResourceCount,
  getResourceCountByContext,
  getResourceCountByType,
  hasResource,
  getResourceDiagnostics,
} from './resource-manager';

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
} from './unified-utils';

// ================================
// 전문화된 유틸리티들 (유지)
// ================================

// Essential media utilities
export * from './media';

// Pattern recognition utilities
export * from './patterns';
