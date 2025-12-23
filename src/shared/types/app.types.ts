/**
 * @fileoverview App Global Types - Integrated barrel export and app-level type definitions
 * @version 4.1.0 - Phase 197: Clear structure improvement
 *
 * **Role**:
 * - Single import point for entire type ecosystem (`@shared/types`)
 * - Direct app-level defined types (AppConfig, Brand types, etc.)
 * - Re-export of subordinate type files
 *
 * **Included Types**:
 * - Core types: Result, BaseService (re-exported from core-types.ts)
 * - UI types: Theme, buttons, loading state (re-exported from ui.types.ts)
 * - Component types: Props, event handlers (re-exported from component.types.ts)
 * - Media types: MediaInfo, MediaItem (re-exported from media.types.ts)
 * - Utilities: Brand types, Nullable, DeepPartial, etc. (defined here)
 *
 * **Alternative import points**:
 * - If detailed types needed: `@shared/types/media.types`, `@shared/types/ui.types` etc. (direct import)
 */

// ================================
// App-level basic type definitions
// ================================

/**
 * Application configuration
 * @description Global configuration required for app initialization
 */
export interface AppConfig {
  readonly version: string;
  readonly isDevelopment: boolean;
  readonly debug: boolean;
  readonly autoStart: boolean;
}

;

// ================================
// Core types and patterns (re-export)
// ================================

// BaseService and service types
;
// Result pattern - re-exported from result.types (Phase 353: AsyncResult added, unified SSOT)
;

// ================================
// Utility types
// ================================

/**
 * Option type - T or null
 * @note Same meaning as Nullable<T> (Phase 363: Nullable removed, integrated into Option)
 */
type Option<T> = T | null;

/**
 * Optional - T or undefined
 * @note Different meaning from Option (null vs undefined)
 */
type Optional<T> = T | undefined;

/**
 * Deep Partial - all nested properties become optional
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ================================
// Brand types (domain-specific type safety)
// ================================

/**
 * Brand type base structure
 * @template T Base type
 * @template B Brand name
 * @description Exists only at compile time, behaves as T at runtime
 */
type Brand<T, B> = T & { readonly __brand: B };

/** User ID */
type UserId = Brand<string, 'UserId'>;
/** Tweet ID */
type TweetId = Brand<string, 'TweetId'>;
/** Service key */
type ServiceKey = Brand<string, 'ServiceKey'>;
/** Element ID */
type ElementId = Brand<string, 'ElementId'>;
/** Media URL */
type MediaUrl = Brand<string, 'MediaUrl'>;
/** Thumbnail URL */
type ThumbnailUrl = Brand<string, 'ThumbnailUrl'>;
/** Original URL */
type OriginalUrl = Brand<string, 'OriginalUrl'>;
/** Filename */
type FileName = Brand<string, 'FileName'>;
/** File extension */
type FileExtension = Brand<string, 'FileExtension'>;

// ================================
// Subordinate type file re-exports
// ================================

// Component Types
;
// Gallery Types (re-exported from core-types)
;

// Media Types
;

;

// Navigation Types
;
;

// Result and Error Codes
;
// Toolbar UI State Types
;
// UI/Theme Types
;

// Phase 421: ViewMode helper utilities removed; use VIEW_MODES from '@constants/video-controls'.
