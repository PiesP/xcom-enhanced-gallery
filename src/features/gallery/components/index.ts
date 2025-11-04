/**
 * @fileoverview Gallery Components
 * @description Main gallery UI components for media presentation and interaction.
 *
 * **Exported Components:**
 * - VerticalGalleryView: Main gallery container with vertical scrolling layout
 * - VerticalImageItem: Individual media item (image/video) presenter
 * - KeyboardHelpOverlay: Keyboard shortcuts and help dialog
 *
 * **Exported Utilities:**
 * - useGalleryKeyboard: Hook for keyboard event handling (navigation, help toggle)
 *
 * **Architecture:**
 * - Components organized in vertical-gallery-view/ directory
 * - KeyboardHelpOverlay moved to vertical-gallery-view/ as internal helper (Phase 215)
 * - All imports use @shared/@features aliases (standardized Phase 214)
 * - PC-only event policy (click, keydown/keyup, wheel, mouse*)
 * - Design tokens for all styling (no hardcoded colors/sizes)
 *
 * @module features/gallery/components
 * @version 6.0 - Restructured with KeyboardHelpOverlay integration
 */

// 메인 갤러리 뷰 컴포넌트
export { VerticalGalleryView } from './vertical-gallery-view/VerticalGalleryView';
export type { VerticalGalleryViewProps } from './vertical-gallery-view/VerticalGalleryView';

// 개별 미디어 아이템 컴포넌트
export { VerticalImageItem } from './vertical-gallery-view/VerticalImageItem';

// 키보드 도움말 모달 (내부 구현)
export { KeyboardHelpOverlay } from './vertical-gallery-view/KeyboardHelpOverlay/KeyboardHelpOverlay';
export type { KeyboardHelpOverlayProps } from './vertical-gallery-view/KeyboardHelpOverlay/KeyboardHelpOverlay';

// 갤러리 커스텀 훅
export { useGalleryKeyboard, useProgressiveImage } from './vertical-gallery-view/hooks';
