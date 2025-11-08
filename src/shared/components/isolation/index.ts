/**
 * @fileoverview Gallery Isolation Components Barrel Export
 * @version 4.0.0 - Phase 384: Simplified naming
 * @description Export Light DOM gallery components with style isolation
 *
 * Phase 1 complexity reduction - Simplified naming convention:
 * - GalleryContainer: Main container component
 * - mountGallery: Rendering function
 * - unmountGallery: Cleanup function
 *
 * Style isolation achieved through CSS Cascade Layers (not Shadow DOM).
 * Provides Twitter.com compatibility without Shadow DOM complexity.
 *
 * @module @shared/components/isolation
 *
 * @example
 * ```typescript
 * import { GalleryContainer, mountGallery, unmountGallery } from '@shared/components/isolation';
 *
 * // Mount
 * const element = () => <GalleryContainer><Content /></GalleryContainer>;
 * mountGallery(container, element);
 *
 * // Unmount
 * unmountGallery(container);
 * ```
 */

// ============================================================================
// Primary exports - Gallery container and lifecycle functions
// Simplified naming (Phase 1 revision)
// ============================================================================
export {
  GalleryContainer,
  mountGallery,
  unmountGallery,
  type GalleryContainerProps,
} from './GalleryContainer';
