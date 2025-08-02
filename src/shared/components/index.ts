/**
 * @fileoverview Shared Components Entry Point
 * @description 공유 컴포넌트 통합 진입점
 */

// Base components - 실제 존재하는 타입들만
export type { BaseComponentProps, InteractiveComponentProps, GalleryComponentProps } from './base';

// HOC components - 실제 존재하는 것들만
export {
  withGallery,
  GalleryHOC,
  withGalleryContainer,
  withGalleryItem,
  withGalleryOverlay,
  getGalleryType,
} from './hoc';
export type { GalleryType, GalleryOptions } from './hoc';

// Isolation components
export * from './isolation';

// UI components
export * from './ui';

// 통합 컴포넌트 관리자
export { componentUtils } from './ComponentManager';
export type {
  ComponentManagerInterface,
  ComponentInstance,
  HookManager,
  StateManager,
  EventManager,
  SharedState,
  WithHooksInterface,
  WithStateInterface,
  WithEventInterface,
} from './ComponentManager';

// 핵심 UI 컴포넌트들
export { Button } from './ui/Button/Button';
export { Toast } from './ui/Toast/Toast';
export { ToastContainer } from './ui/Toast/ToastContainer';
export { Toolbar } from './ui/Toolbar/Toolbar';

// 갤러리 컴포넌트들 (간소화된 명명)
export { GalleryContainer } from './isolation/GalleryContainer';

// 타입들
export type { GalleryContainerProps } from './isolation/GalleryContainer';
export type { ButtonProps } from './ui/Button/Button';
export type { ToastProps } from './ui/Toast/Toast';
export type { ToolbarProps } from './ui/Toolbar/Toolbar';
