/**
 * Shared Utils Barrel Export
 *
 * 새로운 구조로 정리된 공통 유틸리티를 중앙집중식으로 export합니다.
 *
 * 구조:
 * - core/        : DOM, accessibility, theming 등 핵심 유틸리티
 * - media/       : 미디어 처리 및 파일명 생성
 * - patterns/    : 패턴 인식 및 Twitter/X.com 특화 기능
 * - gallery/     : 갤러리 상태 관리 및 보호
 * - vendors/     : 외부 라이브러리 접근점
 * - ui/          : UI 관련 유틸리티 및 관리자
 *
 * @example
 * ```typescript
 * // 카테고리별 import (권장)
 * import { accessibility } from '@shared/utils/core';
 * import { imageFilter } from '@shared/utils/media';
 * import { extractTweetInfoFromUrl } from '@shared/utils/patterns';
 * import { ToolbarTimerManager } from '@shared/utils/ui';
 * import { getFflate } from '@core/external/vendors';
 *
 * // 또는 전체 import
 * import { accessibility, imageFilter } from '@shared/utils';
 * ```
 */

// Core utilities (DOM, accessibility, theming)
export * from './core';

// Type safety utilities (re-exported from infrastructure)
export {
  // Number/string parsing utilities
  safeParseInt,
  safeParseFloat,
  // Array access utilities
  safeArrayGet,
  safeNodeListAccess,
  // RegExp utilities
  safeMatchExtract,
  // Function call utilities
  safeCall,
  safeEventHandler,
  // Type conversion utilities
  undefinedToNull,
  nullToUndefined,
  stringWithDefault,
  // Element validation utilities
  safeElementCheck,
  safeProp,
  // Domain-specific utilities
  safeTweetId,
  safeUsername,
  safeClickedIndex,
  // Object manipulation utilities
  assignOptionalProperty,
  conditionalAssign,
  mergeWithoutUndefined,
  createWithOptionalProperties,
  buildSafeObject,
  removeUndefinedProperties,
} from '@core/utils/type-safety-helpers';

// Gallery utilities (state management, protection)
export * from './gallery';

// Media processing utilities (images, videos, filenames)
export * from './media';

// Pattern recognition utilities (Twitter/X.com, URLs)
export * from './patterns';

// Debug and development utilities
export * from './debug/gallery-debug';

// Error handling utilities
export * from './error-handling';

// Performance utilities
export * from './performance';

// Style utilities
export * from './styles';

// Initialization guard
export { InitializationGuard } from './InitializationGuard';

// Common utilities
export * from './common';

// 스크롤 유틸리티 함수들
export {
  createScrollHandler,
  preventScrollPropagation,
  findTwitterScrollContainer,
  isGalleryElement,
  createScrollDebouncer,
} from './scroll';

// UI 유틸리티
export { ToolbarTimerManager, toolbarTimers } from './ui/ToolbarTimerManager';

// CSS 선택자 검증 유틸리티
export * from './css-selector-validator';
