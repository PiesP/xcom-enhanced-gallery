/**
 * @fileoverview Core Types - Integrated domain and infrastructure types
 * @version 3.0.0 - Phase 197.1: Structure clarification
 *
 * **Role**:
 * This file integrates multiple domain and infrastructure types.
 * Since app.types.ts re-exports these types, direct imports are rare.
 *
 * **Composition** (by section):
 * 1. SERVICE TYPES - Service base interface
 * 2. GALLERY TYPES - Gallery domain (state, action, event)
 * 3. CORE FOUNDATION TYPES - App config & lifecycle
 * 4. RESULT TYPES - Explicit success/failure representation
 *
 * **Recommended usage**:
 * - General: `import type { Result, BaseService } from '@shared/types'` (via app.types.ts)
 * - Detail: `import type { GalleryState } from '@shared/types/core/core-types'`
 *
 * **Phase 197 improvements**:
 * - BaseService duplication removed (re-export from base-service.types.ts)
 * - Result pattern integrated
 * - JSDoc enhanced & sections clarified
 *
 * @see {@link ../app.types.ts} - Re-export hub
 * @see {@link ./base-service.types.ts} - BaseService definition
 * @see {@link ../result.types.ts} - Result pattern & ErrorCode
 */

import type { Cleanupable } from '@shared/types/lifecycle.types';
import type { MediaInfo } from '@shared/types/media.types';
import type { BaseService } from './base-service.types';

// ========================================
// SERVICE TYPES (from services.types.ts)
// ========================================

// Export BaseService from dedicated file (avoid duplication)
export type { BaseService };

/**
 * Service lifecycle state
 */
export type ServiceLifecycle = 'uninitialized' | 'initializing' | 'initialized' | 'destroyed';

// All unused service type definitions removed in Phase 326.6
// Services use concrete implementations instead of interface abstractions

// ========================================
// GALLERY TYPES (from gallery.types.ts)
// ========================================

/**
 * Gallery view mode type
 */
export type GalleryViewMode = 'grid' | 'carousel' | 'slideshow';

/**
 * Gallery state interface (immutability guaranteed)
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
 * Gallery event type
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
// VIEW MODE TYPES (from view-mode.types.ts)
// ========================================

// Phase 380: Type-only export to break circular dependency
// Import removed, re-export ViewMode type only
export type { ViewMode } from '@constants/types';

/**
 * ViewMode helper functions were removed in Phase 421 cleanup.
 * Use VIEW_MODES from '@constants/video-controls' for validation when needed.
 */

// ========================================
// CORE FOUNDATION TYPES (from core.types.ts)
// ========================================

/**
 * Default Gallery Settings
 */
export interface GalleryConfig {
  /** Whether to autoplay */
  autoPlay: boolean;
  /** Whether to show thumbnails */
  showThumbnails: boolean;
  /** Whether download feature is enabled */
  downloadEnabled: boolean;
  /** Whether keyboard navigation is enabled */
  keyboardNavigation?: boolean;
  /** Whether fullscreen mode is supported */
  fullscreenEnabled?: boolean;
  /** Image zoom capability */
  zoomEnabled?: boolean;
}

/**
 * Download Options
 */
export interface DownloadOptions {
  /** Download quality */
  quality?: 'original' | 'high' | 'medium';
  /** Filename format */
  filenameFormat?: string;
  /** Whether compression is enabled */
  compressionEnabled?: boolean;
}

/**
 * Size Information
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Integrated Lifecycle Interface
 */
export interface Lifecycle extends Cleanupable {
  /**
   * Check resource status
   */
  isActive(): boolean;
}

// ========================================
// RESULT TYPES (from result.ts)
// ========================================

/**
 * Result Type - Uses Enhanced Result Pattern
 * @see {@link ../result.types.ts} - Enhanced Result definition and utilities (including AsyncResult)
 *
 * Phase 353: AsyncResult type integration (moved to result.types.ts)
 */
export type { AsyncResult, Result } from '@shared/types/result.types';

// Result utility functions moved to result.types.ts (Phase 355.2)
// - success, failure, partial, cancelled
// - isSuccess, isFailure, isPartial
// - unwrapOr, safe, safeAsync, chain, map
// import { success, failure, isSuccess, ... } from '@shared/types/result.types';
