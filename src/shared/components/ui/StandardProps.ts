/**
 * @fileoverview 표준화된 컴포넌트 Props 재내보내기
 * @description Phase 2-3A: 타입/상수/유틸 분리 완료
 * @version 2.2.0 - 마이그레이션 완료
 * @deprecated 아래 경로들에서 직접 import 사용
 * @see {@link ./types} - 표준 Props 타입
 * @see {@link ./constants} - UI 상수
 * @see {@link @shared/utils/component-utils} - 공용 유틸 함수
 */

// 타입 재내보내기
export type {
  StandardButtonProps,
  StandardToastProps,
  StandardToastContainerProps,
  StandardToolbarProps,
} from './types';

// 상수 재내보내기
export { DEFAULT_SIZES, DEFAULT_VARIANTS, DEFAULT_TOAST_TYPES } from './constants';

// 유틸 함수 재내보내기
export {
  createClassName,
  createAriaProps,
  createTestProps,
  handleLoadingState,
  mergeProps,
  validateProps,
  ComponentStandards,
  type ValidationResult,
} from '../../utils/component-utils';
