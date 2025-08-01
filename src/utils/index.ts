/**
 * @fileoverview 통합 유틸리티
 * @version 1.0.0 - 단순화된 구조
 *
 * 모든 유틸리티 함수를 하나의 위치에서 관리합니다.
 */

// ================================
// 기존 유틸리티 재export (선택적)
// ================================

// 핵심 유틸리티들만 재export
export {
  // DOM 관련
  safeQuerySelector,
  isInsideGallery,
  combineClasses,

  // 성능 관련
  createDebouncer,
  rafThrottle,
  throttleScroll,
  measurePerformance,

  // 갤러리 관련
  galleryDebugUtils,
  findTwitterScrollContainer,
  ensureGalleryScrollAvailable,

  // 미디어 관련
  extractTweetInfoFromUrl,
  removeDuplicateStrings,

  // 타입 안전성
  safeParseInt,
  safeParseFloat,
  stringWithDefault,
  undefinedToNull,
  safeElementCheck,

  // 이벤트 관리
  addListener,
  cleanupEventListeners,

  // 접근성
  detectLightBackground,
} from '../shared/utils';

// 서비스들을 유틸리티로 통합
export * from '../shared/services';
export { CoreService } from '../shared/services/ServiceManager';

// 상태 관리도 유틸리티로 통합
export * from '../shared/state';

// DOM 관련 유틸리티
export * from '../shared/dom';

// 브라우저 유틸리티
export * from '../shared/browser';

// 메모리 관리
export * from '../shared/memory';

// 로깅
export * from '../shared/logging';

// 에러 처리
export * from '../shared/error';

// ================================
// 편의 함수들 re-export - Phase G Week 2: Direct imports recommended
// ================================

// Removed convenience aliases - use direct imports from specific modules
