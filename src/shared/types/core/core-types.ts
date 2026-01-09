/**
 * @fileoverview Core Types - Integrated domain and infrastructure types
 */

import type { Cleanupable } from '@shared/types/lifecycle.types';
import type { MediaInfo } from '@shared/types/media.types';

export type { BaseService } from './base-service.types';

/** Service lifecycle state */
export type ServiceLifecycle = 'uninitialized' | 'initializing' | 'initialized' | 'destroyed';

/** Gallery view mode type */
export type GalleryViewMode = 'grid' | 'carousel' | 'slideshow';

/**
 * Gallery state (immutable)
 */
export interface GalleryState {
  readonly isOpen: boolean;
  readonly currentIndex: number;
  readonly items: readonly MediaInfo[];
  readonly viewMode: GalleryViewMode;
  readonly isFullscreen: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
}

/** Gallery events */
export type GalleryEvents = {
  'gallery:open': { items: MediaInfo[]; startIndex: number };
  'gallery:close': Record<string, never>;
  'gallery:navigate': { index: number; item: MediaInfo };
  'gallery:viewModeChange': { mode: GalleryViewMode };
  'gallery:fullscreenToggle': { isFullscreen: boolean };
  'gallery:error': { error: string };
};
export type { ViewMode } from '@constants/types';

/** Gallery configuration settings */
export interface GalleryConfig {
  readonly autoPlay: boolean;
  readonly showThumbnails: boolean;
  readonly downloadEnabled: boolean;
  readonly keyboardNavigation?: boolean;
  readonly fullscreenEnabled?: boolean;
  readonly zoomEnabled?: boolean;
}

/**
 * Download configuration options
 *
 * @property quality - Download quality level (optional)
 * @property filenameFormat - Custom filename format template (optional)
 * @property compressionEnabled - Whether to compress files (optional)
 */
export interface DownloadOptions {
  readonly quality?: 'original' | 'high' | 'medium';
  readonly filenameFormat?: string;
  readonly compressionEnabled?: boolean;
}

/**
 * 2D size dimensions
 *
 * @property width - Width value in pixels
 * @property height - Height value in pixels
 */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * Integrated lifecycle interface
 *
 * Extends Cleanupable with resource status checking capability.
 *
 * @see {@link ./lifecycle.types.ts} - Cleanupable interface
 */
export interface Lifecycle extends Cleanupable {
  /**
   * Check if the resource is active
   * @returns true if resource is active and usable
   */
  isActive(): boolean;
}

// ========================================
// RESULT TYPES
// ========================================

/**
 * Result type for explicit error handling
 *
 * Use this pattern for operations that may fail. Utility functions
 * are available in `result.types.ts` (success, failure, isSuccess, etc.).
 *
 * @see {@link ../result.types.ts} - Result utilities and AsyncResult type
 */
