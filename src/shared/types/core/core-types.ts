/**
 * @fileoverview Core Types - Integrated domain and infrastructure types
 *
 * **Role**: Integrates domain and infrastructure types for the gallery system.
 * Since `app.types.ts` re-exports these types, direct imports should be rare.
 *
 * **Composition** (by section):
 * 1. SERVICE TYPES - Service lifecycle and base interface
 * 2. GALLERY TYPES - Gallery domain (state, events, view modes)
 * 3. CORE FOUNDATION TYPES - App config, download options, and lifecycle
 * 4. RESULT TYPES - Explicit success/failure representation
 *
 * **Recommended usage**:
 * - General: `import type { Result, BaseService } from '@shared/types'` (via app.types.ts)
 * - Specific: `import type { GalleryState } from '@shared/types/core/core-types'`
 *
 * @see {@link ../app.types.ts} - Re-export hub
 * @see {@link ./base-service.types.ts} - BaseService definition
 * @see {@link ../result.types.ts} - Result pattern utilities
 */

import type { Cleanupable } from '@shared/types/lifecycle.types';
import type { MediaInfo } from '@shared/types/media.types';

export type { BaseService } from './base-service.types';

// ========================================
// SERVICE TYPES (from services.types.ts)
// ========================================

/**
 * Service lifecycle state
 *
 * @see {@link ../lifecycle.types.ts} - Lifecycle interface
 */
export type ServiceLifecycle = 'uninitialized' | 'initializing' | 'initialized' | 'destroyed';

// ========================================
// GALLERY TYPES (from gallery.types.ts)
// ========================================

/**
 * Gallery view mode type
 */
export type GalleryViewMode = 'grid' | 'carousel' | 'slideshow';

/**
 * Gallery state (immutable)
 *
 * @property isOpen - Whether the gallery is currently open
 * @property currentIndex - Zero-based index of the active item
 * @property items - Readonly array of media items
 * @property viewMode - Current gallery view mode
 * @property isFullscreen - Whether fullscreen is active
 * @property isLoading - Whether content is loading
 * @property error - Error message if any, null otherwise
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

/**
 * Gallery event payloads
 *
 * @property gallery:open - Fired when gallery opens
 * @property gallery:close - Fired when gallery closes
 * @property gallery:navigate - Fired when navigating to a different item
 * @property gallery:viewModeChange - Fired when view mode changes
 * @property gallery:fullscreenToggle - Fired when fullscreen state changes
 * @property gallery:error - Fired when an error occurs
 */
export type GalleryEvents = {
  'gallery:open': { items: MediaInfo[]; startIndex: number };
  'gallery:close': Record<string, never>;
  'gallery:navigate': { index: number; item: MediaInfo };
  'gallery:viewModeChange': { mode: GalleryViewMode };
  'gallery:fullscreenToggle': { isFullscreen: boolean };
  'gallery:error': { error: string };
};

// ========================================
// VIEW MODE TYPES
// ========================================

export type { ViewMode } from '@constants/types';

// ========================================
// CORE FOUNDATION TYPES (from core.types.ts)
// ========================================

/**
 * Gallery configuration settings
 *
 * @property autoPlay - Whether to autoplay media
 * @property showThumbnails - Whether to show thumbnail previews
 * @property downloadEnabled - Whether download feature is enabled
 * @property keyboardNavigation - Whether keyboard navigation is enabled (optional)
 * @property fullscreenEnabled - Whether fullscreen mode is supported (optional)
 * @property zoomEnabled - Whether image zoom is enabled (optional)
 */
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
