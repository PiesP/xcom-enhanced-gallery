/**
 * UI Components Barrel Export
 *
 * 모든 UI 컴포넌트를 중앙집중식으로 export합니다.
 * 이를 통해 import 경로를 단순화하고 코드 가독성을 향상시킵니다.
 * @version 2.1.0 - Phase 282 Step 3: StandardProps 재내보내기 제거
 */

// Phase 282 Step 3: StandardProps 재내보내기 제거
// 이제 ./types, ./constants, @shared/utils/component-utils에서 직접 import 사용
export * from './types';
export * from './constants';

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
// ToastItem은 @shared/state (machines) 또는 @shared/services에서 import하세요
// export type { ToastItem } from '@/shared/services/unified-toast-manager';
export type { ToastContainerProps } from './Toast/ToastContainer';

// Toolbar 컴포넌트
export { Toolbar } from './Toolbar/Toolbar';
export type { ToolbarProps } from './Toolbar/Toolbar';
