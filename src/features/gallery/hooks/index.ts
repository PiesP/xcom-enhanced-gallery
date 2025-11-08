/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Hooks Barrel Export
 * @module features/gallery/hooks
 * @description Comprehensive collection of Solid.js hooks for gallery state management,
 * scroll handling, and focus tracking. These hooks provide core functionality for the
 * gallery component hierarchy.
 * @version 2.0.0
 */

// ============================================================================
// Module Structure
// ============================================================================
// hooks/
// ├── useGalleryScroll.ts       - Scroll state & direction detection
// ├── useGalleryItemScroll.ts   - Item-level scroll-to functionality
// ├── useGalleryFocusTracker.ts - Focus management with IntersectionObserver
// └── index.ts                  - Barrel export (this file)
//
// @deprecated useToolbarPositionControl - Replaced by pure CSS hover system

// ============================================================================
// Hook Exports
// ============================================================================

/**
 * Scroll state management and Twitter scroll prevention
 * @see {@link useGalleryScroll}
 */
export { useGalleryScroll } from './useGalleryScroll';

/**
 * Item-level scroll targeting with polling fallback
 * @see {@link useGalleryItemScroll}
 */
export { useGalleryItemScroll } from './useGalleryItemScroll';

/**
 * Focus tracking via IntersectionObserver with auto-focus support
 * @see {@link useGalleryFocusTracker}
 */
export { useGalleryFocusTracker } from './useGalleryFocusTracker';
