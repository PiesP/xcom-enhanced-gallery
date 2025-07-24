/**
 * Shared Utils Barrel Export (단순화됨)
 *
 * 통합된 유틸리티를 사용하여 중복 제거
 */

// 통합된 핵심 유틸리티 (중복 제거된 버전)
export * from '@core/unified-utils';

// 필수 미디어 유틸리티 (특화 기능)
export * from './media';

// 패턴 인식 유틸리티
export * from './patterns';

// 갤러리 전용 유틸리티 (특화 기능)
export * from './gallery-utils';

// 스크롤 유틸리티 (특화 기능)
export {
  createScrollHandler,
  preventScrollPropagation,
  findTwitterScrollContainer,
  isGalleryElement,
  createScrollDebouncer,
} from './scroll';

// 타입 안전성 유틸리티
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

// 에러 처리 (위임)
export * from './error-handling';

// 스타일 유틸리티
export * from './styles';

// 디버그 유틸리티
export * from './debug/gallery-debug';
