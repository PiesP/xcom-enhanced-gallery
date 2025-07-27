/**
 * @fileoverview Shared Utils - Phase 1 단순화 완료
 * @version 1.0.0 - 유틸리티 통합 및 단순화
 *
 * 새로운 구조:
 * - core-utils.ts (통합된 핵심 유틸리티)
 * - unified-events.ts (이벤트 시스템)
 * - resource-manager.ts (리소스 관리)
 */

// ================================
// 통합 유틸리티 (Phase 1 Consolidation)
// ================================

// 핵심 DOM, 성능, 스타일 유틸리티
export {
  // 핵심 유틸리티
  createDebouncer,
  Debouncer,
  findTwitterScrollContainer,
  ensureGalleryScrollAvailable,
  galleryDebugUtils,
  extractTweetInfoFromUrl,
  removeDuplicateStrings,
  measurePerformance,
  rafThrottle,
  throttleScroll,
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
} from './unified-events';

// ================================
// 타입 안전성 헬퍼
// ================================

export {
  safeParseInt,
  safeParseFloat,
  stringWithDefault,
  undefinedToNull,
  safeElementCheck,
} from './core/type-safety-helpers';

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
