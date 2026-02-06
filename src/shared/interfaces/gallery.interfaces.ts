/**
 * @fileoverview Gallery renderer lifecycle contracts
 * @description Defines lifecycle expectations for rendering, closing, and teardown
 */

import type { GalleryRenderOptions, MediaInfo } from '@shared/types/media.types';

/**
 * Lifecycle contract for gallery rendering (mount, visibility, teardown)
 */
export interface GalleryRenderer {
  /**
   * Mount and display gallery for provided media items
   * @param mediaItems - Media items to render in order
   * @param options - Optional render configuration (index, fit mode, etc.)
   */
  render(mediaItems: readonly MediaInfo[], options?: GalleryRenderOptions): Promise<void>;

  /**
   * Hide gallery while preserving resources for future renders
   */
  close(): void;

  /**
   * Tear down gallery and release all resources permanently (safe to call multiple times)
   */
  destroy(): void;

  /**
   * Whether a gallery view is currently active
   */
  isRendering(): boolean;

  /**
   * Register or clear callback invoked after gallery closes
   * @param onClose - Callback to fire on close, or null to clear
   */
  setOnCloseCallback(onClose: (() => void) | null): void;
}
