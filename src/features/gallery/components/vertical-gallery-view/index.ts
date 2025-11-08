/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Vertical Gallery View Component Barrel Export
 * @description Exports main components and types for vertical gallery layout
 * @module features/gallery/components/vertical-gallery-view
 *
 * **Exported Components**:
 * - {@link VerticalGalleryView} - Main gallery view orchestrator
 * - {@link VerticalImageItem} - Individual media item renderer
 *
 * **Exported Types**:
 * - {@link VerticalGalleryViewProps} - Gallery props interface
 *
 * **Internal Components** (not exported):
 * - KeyboardHelpOverlay: Help dialog (internal to VerticalGalleryView)
 * - Custom hooks (keyboard, scroll, focus management)
 *
 * **Module Structure**:
 * ```
 * vertical-gallery-view/
 * ├── hooks/                          # Custom hooks
 * │   ├── useGalleryKeyboard.ts
 * │   ├── useProgressiveImage.ts
 * │   └── index.ts
 * ├── KeyboardHelpOverlay/             # Help modal
 * │   ├── KeyboardHelpOverlay.tsx
 * │   └── KeyboardHelpOverlay.module.css
 * ├── VerticalGalleryView.tsx          # Main component
 * ├── VerticalGalleryView.module.css
 * ├── VerticalImageItem.tsx            # Item renderer
 * ├── VerticalImageItem.module.css
 * ├── VerticalImageItem.types.ts       # Item types
 * ├── VerticalImageItem.helpers.ts     # Item utilities
 * └── index.ts                         # Barrel export (this file)
 * ```
 *
 * **Usage**:
 * ```tsx
 * import { VerticalGalleryView, VerticalImageItem } from '@features/gallery/components/vertical-gallery-view';
 * ```
 *
 * @version 1.2.0 - Enhanced barrel export documentation (Phase 354+)
 */

export { VerticalGalleryView } from './VerticalGalleryView';
export type { VerticalGalleryViewProps } from './VerticalGalleryView';
export { VerticalImageItem } from './VerticalImageItem';
