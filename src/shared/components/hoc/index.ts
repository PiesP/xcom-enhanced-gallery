/**
 * @fileoverview Higher-Order Components Barrel Export
 * @version 4.0.0 - Phase 381: Simplified HOC system
 * @description Central export point for HOC components
 *
 * Version 4.0 provides a streamlined HOC system (Phase 3) with:
 * - Unified gallery component wrapper
 * - Type-safe configuration
 * - Accessibility and event handling built-in
 *
 * @module @shared/components/hoc
 *
 * @example
 * ```typescript
 * import { withGallery, type GalleryComponentProps } from '@shared/components/hoc';
 *
 * const GalleryButton = withGallery(Button, {
 *   type: 'control',
 *   className: 'download-btn'
 * });
 * ```
 */

// ============================================================================
// Primary exports - Gallery HOC components
// Barrel surface minimized: exposing only actual used symbols
// ============================================================================
export { withGallery, type GalleryComponentProps } from "./GalleryHOC";
