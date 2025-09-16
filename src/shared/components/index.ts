/**
 * @fileoverview Shared Components Exports
 * @version 3.0.0 - Phase 2-3A: BaseComponentProps 통합
 * @description 공통 컴포넌트들의 정리된 export
 */

// 기본 컴포넌트 Props 시스템 (Phase 2-3A)
export * from './base';

// 핵심 UI 컴포넌트들
export { Button } from './ui/Button/Button';
export { Toast } from './ui/Toast/Toast';
export { ToastContainer } from './ui/Toast/ToastContainer';
export { ErrorBoundary } from './ui/ErrorBoundary/ErrorBoundary';
export { Toolbar } from './ui/Toolbar/Toolbar';

// 갤러리 컴포넌트들 (간소화된 명명)
export { GalleryContainer } from './isolation/GalleryContainer';

// 타입들
export type { GalleryContainerProps } from './isolation/GalleryContainer';
export type { ButtonProps } from './ui/Button/Button';
export type { ToastProps } from './ui/Toast/Toast';
export type { ToolbarProps } from './ui/Toolbar/Toolbar';
