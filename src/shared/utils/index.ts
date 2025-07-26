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
// 통합 이벤트 관리 시스템 (Phase 1 통합 완료)
// ================================

// 통합된 이벤트 관리 (event-dispatcher + event-utils 통합)
export {
  // 기본 이벤트 관리
  addEventListenerManaged,
  addMultipleEventListeners,
  removeEventListenerManaged,
  removeEventListenersByContext,
  removeEventListenersByType,
  removeAllEventListeners,
  getEventListenerStatus,
  cleanupEventDispatcher,

  // 갤러리 이벤트 관리
  initializeGalleryEvents,
  cleanupGalleryEvents,
  getGalleryEventStatus,
  updateGalleryEventOptions,

  // 통합 관리자 클래스들
  GalleryEventManager,
  EventDispatcher,
  GalleryEventCoordinator,

  // 타입 정의
  type EventHandlers,
  type GalleryEventOptions,
} from './unified-events';

// ================================
// DOM + CSS 선택자 유틸리티 (Phase 1 통합)
// ================================

export {
  // 갤러리 요소 감지
  isInsideGallery,
  isGalleryContainer,
  isGalleryInternalEvent,
  shouldBlockGalleryEvent,

  // 안전한 DOM 접근
  safeQuerySelector,
  safeQuerySelectorAll,
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

  // CSS 선택자 유틸리티
  isValidCSSSelector,
  parseAttributeSelector,
  findFirstMatchingSelector,
  calculateSelectorComplexity,
  hasPerformanceIssues,
  calculateSelectorSpecificity,
  compareSelectorSpecificity,
} from './unified-dom';

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
