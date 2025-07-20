/**
 * @fileoverview Shared Components Exports
 * @version 2.0.0 - Phase 2B Step 2 Optimization
 * @description 공통 컴포넌트들의 정리된 export
 */

// 핵심 UI 컴포넌트들
export { Button } from './ui/Button/Button';
export { Toast } from './ui/Toast/Toast';
export { ToastContainer } from './ui/Toast/ToastContainer';
export { Toolbar } from './ui/Toolbar/Toolbar';

// 고차 컴포넌트들
export { withGalleryMarker } from './hoc/GalleryMarker';

// 격리 컴포넌트들 (갤러리 전용)
export { IsolatedGalleryContainer } from './isolation/IsolatedGalleryContainer';
export { IsolatedGalleryRoot } from './isolation/IsolatedGalleryRoot';

// 레거시 컴포넌트 (향후 제거 예정)
export { GalleryViewer } from './GalleryViewer';

// 타입들
export type { IsolatedGalleryContainerProps } from './isolation/IsolatedGalleryContainer';
export type { ButtonProps } from './ui/Button/Button';
export type { ToastProps } from './ui/Toast/Toast';
export type { ToolbarProps } from './ui/Toolbar/Toolbar';
