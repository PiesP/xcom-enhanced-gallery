/**
 * UI Components Barrel Export
 *
 * 모든 UI 컴포넌트를 중앙집중식으로 export합니다.
 * 이를 통해 import 경로를 단순화하고 코드 가독성을 향상시킵니다.
 * @version 3.0.0 - Phase 352: Named export 최적화
 */

// Phase 352: Explicit named exports
export type {
  StandardButtonProps,
  StandardToastProps,
  StandardToastContainerProps,
  StandardToolbarProps,
} from './types';

export { DEFAULT_SIZES, DEFAULT_VARIANTS, DEFAULT_TOAST_TYPES } from './constants';

// Icon 컴포넌트
export { Icon } from './Icon/Icon';
export type { IconProps } from './Icon/Icon';

// 지연 로딩 아이콘 (Phase 224)
export { LazyIcon, useIconPreload, useCommonIconPreload } from './Icon/lazy-icon';
export type { LazyIconProps } from './Icon/lazy-icon';

// Button 컴포넌트
export { default as Button } from './Button/Button';
export type { ButtonProps } from './Button/Button';
export { default as IconButton } from './Button/IconButton';
export type { IconButtonProps } from './Button/IconButton';

// Toast 컴포넌트 — 상태성 함수는 서비스에서만 제공(배럴 재노출 금지)
export { Toast } from './Toast/Toast';
export { ToastContainer } from './Toast/ToastContainer';
export type { ToastContainerProps } from './Toast/ToastContainer';

// Toolbar 컴포넌트
export { Toolbar } from './Toolbar/Toolbar.tsx';
export type { ToolbarProps, GalleryToolbarProps, FitMode } from './Toolbar/Toolbar.types';
