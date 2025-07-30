/**
 * @fileoverview Shared Utils - Phase D 복잡도 간소화
 * @version 2.0.0 - 모듈 분리 및 복잡도 감소
 *
 * 새로운 구조:
 * - utils.ts (메인 간소화된 유틸리티)
 * - styles/ (CSS 관련)
 * - scroll/ (스크롤 관련)
 * - deduplication/ (중복 제거)
 * - accessibility/ (접근성)
 * - debug/ (디버깅)
 * - performance/ (성능)
 */

// ================================
// 메인 유틸리티 (간소화된 버전)
// ================================

// 모든 간소화된 유틸리티를 utils.ts에서 re-export
export * from './utils';

// ================================
// 기존 유틸리티들 (하위 호환성)
// ================================

// Animation utilities (Phase 1 추가)
export * from './animations';

// Debug utilities for toolbar visibility
export * from './debug/toolbar-visibility-debug';

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

// 핵심 DOM 및 기타 유틸리티 (core-utils에서)
export {
  findTwitterScrollContainer,
  ensureGalleryScrollAvailable,
  extractTweetInfoFromUrl,
  safeQuerySelector,
  isInsideGallery,
  releaseResource,
} from './core-utils';

// ================================
// 통합 이벤트 관리 시스템 (기존 유지)
// ================================

export {
  addListener,
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

export { createTimer, createManagedInterval, ResourceManager } from './resource-manager';

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
// 편의 함수들 - Phase G Week 2: Direct imports recommended
// ================================

// Removed convenience aliases - use direct imports from specific modules

// ================================
// Phase 6: 성능 최적화 (Performance Optimization)
// ================================

// 메모리 풀링 (객체 재사용을 통한 GC 최적화)
export * from './memory';

// 배치 DOM 업데이트 (레이아웃 스래싱 방지)
export * from './dom/BatchDOMUpdateManager';
