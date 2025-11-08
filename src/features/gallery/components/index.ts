/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Components Barrel Export
 * @description Main gallery UI components for media presentation and user interaction
 * @module features/gallery/components
 *
 * **Exported Components**:
 * - {@link VerticalGalleryView} - Main gallery container with vertical scrolling layout
 *   - Full-screen modal gallery for displaying media collections
 *   - Manages scroll position, focus, and keyboard navigation
 *   - Handles media loading, visibility tracking, and fit modes
 * - {@link VerticalImageItem} - Individual media item renderer
 *   - Renders image or video elements
 *   - Supports multiple fit modes (original, fitWidth, fitHeight, fitContainer)
 *   - Manages loading states and error handling
 * - {@link KeyboardHelpOverlay} - Keyboard shortcuts and help dialog
 *   - Modal dialog showing available keyboard shortcuts
 *   - Focus trapping and accessibility support
 *   - Auto-show on help key press (Shift+? or ?)
 *
 * **Exported Types**:
 * - {@link VerticalGalleryViewProps} - Gallery view configuration
 * - {@link KeyboardHelpOverlayProps} - Help overlay configuration
 *
 * **Exported Hooks**:
 * - {@link useGalleryKeyboard} - Hook for keyboard event handling
 *   - Manages Escape key (close gallery) and Help key (toggle overlay)
 *   - Auto-cleanup on component unmount
 * - {@link useProgressiveImage} - Hook for progressive image loading
 *   - Blur-up effect with low-quality placeholder
 *   - Loading state tracking and retry logic
 *
 * **Architecture**:
 * - Components organized in vertical-gallery-view/ directory
 * - KeyboardHelpOverlay co-located in vertical-gallery-view/ (Phase 215)
 * - Custom hooks in vertical-gallery-view/hooks/ subdirectory
 * - All imports use @shared/@features path aliases (Phase 214+)
 * - PC-only event policy: no touch or pointer events
 * - Design tokens for all styling: no hardcoded colors or dimensions
 *
 * **Module Structure**:
 * ```
 * gallery/components/
 * ├── index.ts                         # Barrel export (this file)
 * ├── vertical-gallery-view/
 * │   ├── index.ts                     # Sub-barrel export
 * │   ├── VerticalGalleryView.tsx      # Main gallery component
 * │   ├── VerticalGalleryView.module.css
 * │   ├── VerticalImageItem.tsx        # Media item renderer
 * │   ├── VerticalImageItem.module.css
 * │   ├── VerticalImageItem.types.ts   # Type definitions
 * │   ├── VerticalImageItem.helpers.ts # Utility functions
 * │   ├── KeyboardHelpOverlay/
 * │   │   ├── KeyboardHelpOverlay.tsx
 * │   │   └── KeyboardHelpOverlay.module.css
 * │   └── hooks/
 * │       ├── useGalleryKeyboard.ts
 * │       ├── useProgressiveImage.ts
 * │       └── index.ts
 * └── ... (other potential components)
 * ```
 *
 * **Usage**:
 * ```tsx
 * import {
 *   VerticalGalleryView,
 *   VerticalImageItem,
 *   KeyboardHelpOverlay,
 *   useGalleryKeyboard,
 * } from '@features/gallery/components';
 * ```
 *
 * @version 6.1.0 - Enhanced barrel export documentation (Phase 354+)
 */

/**
 * Main gallery view component: Full-screen modal container
 * - Fixed positioning fills entire viewport
 * - Handles scroll position tracking and focus management
 * - Implements keyboard navigation (arrow keys, Escape, Help)
 * - Manages media visibility and preloading
 * @see {@link VerticalGalleryView}
 * @see {@link VerticalGalleryViewProps}
 */
export { VerticalGalleryView } from './vertical-gallery-view/VerticalGalleryView';
export type { VerticalGalleryViewProps } from './vertical-gallery-view/VerticalGalleryView';

/**
 * Individual media item component: Image or video renderer
 * - Supports multiple fit modes for responsive sizing
 * - Auto-pauses videos when item becomes invisible
 * - Handles loading states with CLS prevention
 * - Provides context menu and download support
 * @see {@link VerticalImageItem}
 * @see {@link VerticalImageItemProps}
 */
export { VerticalImageItem } from './vertical-gallery-view/VerticalImageItem';

/**
 * Keyboard help overlay modal: Shortcuts and help information
 * - Modal dialog with focus trapping
 * - Accessible to screen readers (ARIA attributes)
 * - Auto-show on Help key press
 * - Close on Escape key or close button click
 * @see {@link KeyboardHelpOverlay}
 * @see {@link KeyboardHelpOverlayProps}
 */
export { KeyboardHelpOverlay } from './vertical-gallery-view/KeyboardHelpOverlay/KeyboardHelpOverlay';
export type { KeyboardHelpOverlayProps } from './vertical-gallery-view/KeyboardHelpOverlay/KeyboardHelpOverlay';

/**
 * Custom hooks for gallery functionality
 * - useGalleryKeyboard: Manages keyboard navigation (Escape, Help)
 * - useProgressiveImage: Handles progressive image loading with blur-up
 * @see {@link useGalleryKeyboard}
 * @see {@link useProgressiveImage}
 */
export { useGalleryKeyboard, useProgressiveImage } from './vertical-gallery-view/hooks';
