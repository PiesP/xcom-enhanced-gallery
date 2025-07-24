/**
 * @fileoverview Shared Utils - Phase 4 통합 완료
 * @version 4.0.0 - Utils 통합 및 중복 제거 완료
 *
 * 핵심 유틸리티만 선별하여 export하고 중복을 완전히 제거했습니다.
 * 모든 공통 기능들이 unified-utils.ts로 통합되었습니다.
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

// ================================
// Notes
// ================================

/*
Phase 4 통합 결과:

제거된 중복 항목들:
- performance.ts의 개별 함수들 → unified-utils.ts로 통합
- scroll.ts의 개별 함수들 → unified-utils.ts로 통합
- styles/ 디렉토리의 분산된 함수들 → unified-utils.ts로 통합
- common/deduplication.ts → unified-utils.ts로 통합
- debug/gallery-debug.ts → unified-utils.ts로 통합 (단순화)

통합된 기능들:
✅ 성능 최적화 (debounce, throttle, RAF)
✅ 스타일 조작 (클래스, CSS 변수)
✅ 스크롤 핸들링 (이벤트, 컨테이너 검색)
✅ 중복 제거 (범용, 미디어 전용)
✅ 디버깅 (갤러리 진단, 단순화됨)

유지된 모듈들:
✅ media/ - 미디어 전용 로직
✅ patterns/ - URL 패턴 매칭
✅ core/accessibility - 접근성 함수들
✅ css-selector-validator - CSS 검증
✅ error-handling - 오류 처리 위임
*/
