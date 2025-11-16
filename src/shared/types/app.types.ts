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
  /** Whether to delay gallery rendering after window load (default true, except in test mode) */
  readonly renderAfterLoad?: boolean;
}

/**
 * Synchronously cleanupable resource interface
 * @description Contract for objects requiring memory/resource cleanup
 */
export interface Cleanupable {
  cleanup(): void;
}

// ================================
// Core types and patterns (re-export)
// ================================

// Result pattern - re-exported from result.types (Phase 353: AsyncResult added, unified SSOT)
export type { Result, AsyncResult } from './result.types';

// BaseService and service types
export type { BaseService } from './core/core-types';
export type { ServiceLifecycle } from './core/core-types';

// ================================
// Utility types
// ================================

/**
 * Option type - T or null
 * @note Same meaning as Nullable<T> (Phase 363: Nullable removed, integrated into Option)
 */
export type Option<T> = T | null;

/**
 * Optional - T or undefined
 * @note Different meaning from Option (null vs undefined)
 */
export type Optional<T> = T | undefined;

/**
 * Deep Partial - all nested properties become optional
 */
export type DeepPartial<T> = {
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
export type UserId = Brand<string, 'UserId'>;
/** Tweet ID */
export type TweetId = Brand<string, 'TweetId'>;
/** Service key */
export type ServiceKey = Brand<string, 'ServiceKey'>;
/** Element ID */
export type ElementId = Brand<string, 'ElementId'>;
/** Media URL */
export type MediaUrl = Brand<string, 'MediaUrl'>;
/** Thumbnail URL */
export type ThumbnailUrl = Brand<string, 'ThumbnailUrl'>;
/** Original URL */
export type OriginalUrl = Brand<string, 'OriginalUrl'>;
/** Filename */
export type FileName = Brand<string, 'FileName'>;
/** File extension */
export type FileExtension = Brand<string, 'FileExtension'>;

// ================================
// Subordinate type file re-exports
// ================================

// UI/테마 타입
export type {
  Theme,
  GalleryTheme,
  ButtonVariant,
  ButtonSize,
  ColorVariant,
  LoadingState,
  AsyncState,
  AnimationConfig,
  ImageFitMode,
  ImageFitOptions,
  ImageFitCallbacks,
  FilenameStrategy,
  MediaFileExtension,
  GlobalConfig,
} from './ui.types';

// 컴포넌트 타입
export type {
  VNode,
  ComponentType,
  ComponentChildren,
  CSSProperties,
  BaseComponentProps,
  InteractiveComponentProps,
  LoadingComponentProps,
  SizedComponentProps,
  VariantComponentProps,
  FormComponentProps,
  ContainerComponentProps,
  GalleryComponentProps,
  EventHandler,
  MouseEventHandler,
  KeyboardEventHandler,
  AsyncFunction,
  AsyncCallback,
  OptionalCallback,
  ErrorHandler,
  AsyncErrorHandler,
  ProgressCallback,
  ApiResponse,
  ApiError,
  RequestOptions,
  PaginationInfo,
  FileInfo,
} from './component.types';

// 미디어 타입
export type {
  MediaType,
  MediaQuality,
  MediaId,
  MediaInfo,
  MediaEntity,
  MediaInfoWithFilename,
  TweetInfo,
  MediaExtractionOptions,
  MediaExtractionResult,
  TweetInfoExtractionStrategy,
  MediaExtractor,
  PageType,
  ExtractionSource,
} from './media.types';

export { ExtractionError } from './media.types';

// 네비게이션 타입
export type { NavigationSource } from './navigation.types';

// 툴바 UI 상태 타입
export type { ToolbarDataState, FitMode, ToolbarState, ToolbarActions } from './toolbar.types';

// Result 및 에러 코드
export type { BaseResultStatus, BaseResult, ResultSuccess, ResultError } from './result.types';
export { ErrorCode } from './result.types';

// 갤러리 타입 (core-types에서 재-export)
export type { GalleryViewMode } from './core/core-types';
export type { ViewMode } from './core/core-types';

// Phase 421: ViewMode helper utilities removed; use VIEW_MODES from '@/constants'.
