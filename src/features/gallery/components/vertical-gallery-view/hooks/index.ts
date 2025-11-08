/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Vertical Gallery View Hooks
 * @description Custom hooks collection for gallery view component
 * @module features/gallery/components/vertical-gallery-view/hooks
 *
 * **Exported Hooks**:
 * - {@link useGalleryKeyboard} - Keyboard event handling (Esc, Help)
 * - {@link useProgressiveImage} - Progressive image loading with blur-up
 *
 * @version 2.1.0 - Enhanced JSDoc and barrel export organization (Phase 354+)
 */

export { useGalleryKeyboard } from './useGalleryKeyboard';
export type { UseGalleryKeyboardOptions } from './useGalleryKeyboard';

export { useProgressiveImage } from './useProgressiveImage';
export type { ProgressiveImageOptions, ProgressiveImageResult } from './useProgressiveImage';
