/**
 * @fileoverview Shared Utils - Phase C 에러 처리 통합
 * @version 1.0.0 - 유틸리티 통합 및 단순화, 에러 처리 표준화
 *
 * 새로운 구조:
 * - core-utils.ts (통합된 핵심 유틸리티)
 * - unified-events.ts (이벤트 시스템)
 * - resource-manager.ts (리소스 관리)
 * - convenience.ts (편의 함수들)
 * - error-handling.ts (에러 처리 표준화)
 */

// ================================
// 통합 유틸리티 (Phase 1 Consolidation)
// ================================

// Animation utilities (Phase 1 추가)
export * from './animations';

// Error handling utilities (Phase C 추가)
export {
  standardizeError,
  getErrorMessage,
  isRetryableError,
  isFatalError,
  serializeError,
  withFallback,
  withRetry,
} from './error-handling';

// Timer management utilities (Phase C 추가)
export {
  TimerManager,
  globalTimerManager,
  safePerformanceNow,
  createManagedDebounce,
  createManagedThrottle,
} from './timer-management';

// Type safety helpers (이동된 위치)
export {
  safeParseInt,
  safeParseFloat,
  undefinedToNull,
  stringWithDefault,
  safeElementCheck,
} from './type-safety-helpers';

// 핵심 DOM, 성능, 스타일 유틸리티
export {
  // 성능 유틸리티 (직접 performance-utils에서)
  createDebouncer,
  Debouncer,
  rafThrottle,
  throttleScroll,
  measurePerformance,
  measureAsyncPerformance,
} from './performance/performance-utils';

export {
  // DOM 및 기타 핵심 유틸리티
  findTwitterScrollContainer,
  ensureGalleryScrollAvailable,
  galleryDebugUtils,
  extractTweetInfoFromUrl,
  removeDuplicateStrings,
  safeQuerySelector,
  isInsideGallery,
  combineClasses,
  releaseResource,
} from './core-utils';

// ================================
// 접근성 유틸리티
// ================================

export {
  calculateContrastRatio,
  detectActualBackgroundColor,
  detectLightBackground,
  getRelativeLuminance,
  meetsWCAGAA,
  meetsWCAGAAA,
  parseColor,
} from './accessibility';

// ================================
// 통합 이벤트 관리 시스템 (기존 유지)
// ================================

export {
  addEventListenerManaged,
  addMultipleEventListeners,
  removeEventListenerManaged,
  removeEventListenersByContext,
  removeEventListenersByType,
  getActiveListenerCount,
  clearAllEventListeners,
  cleanupEventListeners,
  isClickableElement,
  isMediaElement,
  createCustomEvent,
  dispatchManagedEvent,
  handleTwitterEvent,
  TwitterEventManager,
  initializeGalleryEvents,
  cleanupGalleryEvents,
} from './events';

// ================================
// 리소스 관리
// ================================

export { createManagedTimer, createManagedInterval, ResourceManager } from './resource-manager';

// ================================
// 미디어 유틸리티
// ================================

export {
  isValidMediaUrl,
  extractOriginalImageUrl,
  getMediaUrlsFromTweet,
  getHighQualityMediaUrl,
  createMediaInfoFromImage,
  createMediaInfoFromVideo,
} from './media/media-url.util';

// ================================
// URL 패턴 매칭
// ================================

export { URLPatterns } from './patterns/url-patterns';

// ================================
// 미디어 클릭 감지
// ================================

export { MediaClickDetector } from './media/MediaClickDetector';

// ================================
// 이미지 필터링
// ================================

export { imageFilter } from './media/image-filter';

// ================================
// 편의 함수들
// ================================

export * from './convenience';

// ================================
// Phase 6: 고급 성능 최적화 (Advanced Performance Optimization)
// ================================

// Web Workers Pool (CPU 집약적 작업 오프로드)
export * from './workers';

// 메모리 풀링 (객체 재사용을 통한 GC 최적화)
export * from './memory';

// 배치 DOM 업데이트 (레이아웃 스래싱 방지)
export * from './dom/BatchDOMUpdateManager';

// 성능 프로파일링 (실시간 성능 모니터링)
export * from './profiling';
