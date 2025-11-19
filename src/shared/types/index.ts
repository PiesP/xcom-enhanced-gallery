/**
 * Shared Types Barrel Export
 *
 * @fileoverview Single import point for entire type ecosystem
 * @version 6.0.0 - Phase 352: Named export optimization
 *
 * **Structure**:
 * ```
 * types/
 * ├── index.ts (current) - barrel export
 * ├── app.types.ts - app global types + re-export hub
 * ├── ui.types.ts - UI/theme types
 * ├── component.types.ts - component Props/events
 * ├── media.types.ts - media-related types
 * ├── result.types.ts - Result pattern & ErrorCode
 * ├── navigation.types.ts - navigation types
 * └── core/ - core domain & infrastructure
 *     ├── core-types.ts - core types
 *     ├── base-service.types.ts - BaseService (circular dependency prevention)
 *     ├── userscript.d.ts - UserScript API
 *     └── index.ts - core barrel
 * ```
 *
 * **Usage Guide**:
 * - General case: `import type { ... } from '@shared/types'`
 * - Detailed types needed: `import type { ... } from '@shared/types/media.types'`
 * - Result pattern only: `import { success, failure } from '@shared/types/result.types'`
 */

// ==========================================
// Phase 352: Explicit Named Exports
// ==========================================

// Media-related types (only most frequently used ones specified)
export type { MediaType, MediaQuality } from '@/constants';
export type {
  MediaInfo,
  MediaEntity,
  MediaId,
  TweetInfo,
  QuoteTweetInfo,
  MediaExtractionOptions,
  MediaExtractionResult,
  ExtractionSource,
  PageType,
  ExtractionOptions,
  ExtractionMetadata,
  ExtractionContext,
  MediaExtractor,
  TweetInfoExtractionStrategy,
  APIExtractor,
  FallbackExtractionStrategy,
  DownloadMediaItem,
  BulkDownloadOptions,
  GalleryRenderOptions,
  GalleryOpenEventDetail,
  GalleryOpenEvent,
  GalleryCloseEvent,
  MediaCollection,
  MediaPageType,
  ExtractionStrategy,
  ValidationIssue,
  ValidationResult,
  MediaValidationResult,
  MediaMetadata,
  MediaInfoWithFilename,
  TweetUrl,
  UrlWithFilename,
  ExtractionConfidence,
} from './media.types';

export {
  PageType as MediaPageTypeEnum,
  ExtractionSource as ExtractionSourceEnum,
} from './media.types';

// App global types (Phase 355.2: Result types removed, moved to result.types)
export type {
  AppConfig,
  Cleanupable,
  AsyncResult,
  BaseService,
  ServiceLifecycle,
  Option,
  Optional,
  DeepPartial,
  UserId,
  TweetId,
  ServiceKey,
  ElementId,
  MediaUrl,
} from './app.types';

// Core types from app.types re-exports
export type {
  ViewMode,
  GalleryViewMode,
  GalleryState,
  GalleryEvents,
  GalleryConfig,
  DownloadOptions,
  Size,
  Lifecycle,
} from './core/core-types';

// Phase 421: ViewMode helpers removed; use VIEW_MODES from '@/constants'

// UI/theme types
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

// Component Props types
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
} from './component.types';

// Navigation state types
export type { NavigationSource } from './navigation.types';

// Toolbar UI state types
export type {
  ToolbarDataState,
  FitMode,
  ToolbarState,
  ToolbarActions,
  ToolbarViewModel,
} from './toolbar.types';

// Result pattern types (ErrorCode and Result related)
export type {
  BaseResultStatus,
  ErrorCode,
  BaseResult,
  ResultSuccess,
  ResultPartial,
  ResultError,
  Result,
} from './result.types';

// Result utility functions (Phase 355.2)
export {
  success,
  failure,
  partial,
  cancelled,
  isSuccess,
  isFailure,
  isPartial,
  unwrapOr,
  safe,
  safeAsync,
  chain,
  map,
} from './result.types';

// UserScript API types (re-exported directly from userscript definition)
export type {
  UserScriptInfo,
  BrowserEnvironment,
  UserScriptGrant,
  UserScriptConnect,
  UserScriptRunAt,
  UserScriptMetadata,
} from './core/userscript.d';
