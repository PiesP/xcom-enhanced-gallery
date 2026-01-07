/**
 * @fileoverview Gallery renderer contracts for feature ↔ shared coordination.
 * Defines lifecycle expectations for rendering, closing, and teardown.
 */

import type { GalleryRenderOptions, MediaInfo } from '@shared/types/media.types';

/**
 * Lifecycle contract for gallery rendering.
 * Implementations must handle mounting, visibility changes, teardown, and host callbacks.
 */
export interface GalleryRenderer {
  /**
   * Mount and display the gallery for the provided media items.
   * Implementations should be idempotent and guard against empty input.
   *
   * @param mediaItems - Media items to render in order.
   * @param options - Optional render configuration (index, fit mode, etc.).
   */
  render(mediaItems: readonly MediaInfo[], options?: GalleryRenderOptions): Promise<void>;

  /**
   * Hide the gallery while preserving resources for future renders.
   */
  close(): void;

  /**
   * Tear down the gallery and release all resources permanently.
   * Safe to call multiple times.
   */
  destroy(): void;

  /**
   * Whether a gallery view is currently active.
   */
  isRendering(): boolean;

  /**
   * Register or clear a callback invoked after the gallery closes.
   *
   * @param onClose - Callback to fire on close; pass null to clear.
   */
  setOnCloseCallback(onClose: (() => void) | null): void;
}
