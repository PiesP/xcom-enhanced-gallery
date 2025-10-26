/**
 * @fileoverview Shared Components Exports
 * @version 3.1.0 - Phase 2-3A: BaseComponentProps 타입 통합
 * @description 공통 컴포넌트들의 정리된 export
 */

// 기본 컴포넌트 Props 시스템 (이제 @shared/types에서 정의됨)
export * from './base';

// 핵심 UI 컴포넌트들
export { Button } from './ui/Button/Button';
export { Toast } from './ui/Toast/Toast';
export { ToastContainer } from './ui/Toast/ToastContainer';
export { ErrorBoundary } from './ui/ErrorBoundary/ErrorBoundary';
export { Toolbar } from './ui/Toolbar/Toolbar';

// 갤러리 컴포넌트들 (간소화된 명명)
export { GalleryContainer } from './isolation/GalleryContainer';

// 타입들 (공통 타입은 @shared/types/app.types에서)
export type { GalleryContainerProps } from './isolation/GalleryContainer';
export type { ButtonProps } from './ui/Button/Button';
export type { ToastProps } from './ui/Toast/Toast';
export type { ToolbarProps } from './ui/Toolbar/Toolbar';
