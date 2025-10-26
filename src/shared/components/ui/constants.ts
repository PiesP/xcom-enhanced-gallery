/**
 * @fileoverview UI 컴포넌트 상수
 * @description Phase 2-3A: StandardProps에서 분리된 상수
 * @version 1.0.0
 */

/** 기본 사이즈 맵 */
export const DEFAULT_SIZES = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
  xl: 'extra-large',
} as const;

/** 기본 변형 맵 */
export const DEFAULT_VARIANTS = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
  success: 'success',
  warning: 'warning',
} as const;

/** 기본 Toast 타입 맵 */
export const DEFAULT_TOAST_TYPES = {
  info: 'info',
  warning: 'warning',
  error: 'error',
  success: 'success',
} as const;
