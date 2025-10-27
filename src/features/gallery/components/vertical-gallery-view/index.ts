/**
 * @fileoverview Vertical Gallery View Components
 * @description Internal components and utilities for vertical gallery layout.
 *
 * **Components:**
 * - VerticalGalleryView: Main gallery view orchestrator
 * - VerticalImageItem: Media item renderer
 * - KeyboardHelpOverlay: Help dialog (internal to VerticalGalleryView)
 *
 * **Module Structure:**
 * - hooks/: Custom hooks for keyboard, scroll, focus management
 * - VerticalGalleryView.tsx: Gallery container component
 * - VerticalImageItem.tsx: Item renderer component
 * - KeyboardHelpOverlay/: Help modal component
 *
 * @module features/gallery/components/vertical-gallery-view
 * @internal
 */

export { VerticalGalleryView } from './VerticalGalleryView';
export type { VerticalGalleryViewProps } from './VerticalGalleryView';
export { VerticalImageItem } from './VerticalImageItem';
