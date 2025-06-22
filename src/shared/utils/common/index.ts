/**
 * @fileoverview 공통 유틸리티 함수 진입점
 * @version 2.0.0 - 단순화 및 일관성 개선
 */

// 중복 제거 함수 (통합됨)
export { removeDuplicateMediaItems } from './deduplication';

// 호환성을 위한 별칭 (Deprecated)
export { removeDuplicateMediaItems as removeDuplicates } from './deduplication';
