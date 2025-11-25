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
export type { MediaQuality, MediaType } from "@/constants";
export type {
  APIExtractor,
  ExtractionMetadata,
  ExtractionSource,
  ExtractionStrategy,
  GalleryRenderOptions,
  MediaEntity,
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaExtractor,
  MediaId,
  MediaInfo,
  MediaInfoWithFilename,
  PageType,
  QuoteTweetInfo,
  TweetInfo,
} from "./media.types";

export {
  ExtractionSource as ExtractionSourceEnum,
  PageType as MediaPageTypeEnum,
} from "./media.types";

// App global types (Phase 355.2: Result types removed, moved to result.types)
export type {
  AppConfig,
  AsyncResult,
  BaseService,
  Cleanupable,
  DeepPartial,
  ElementId,
  MediaUrl,
  Option,
  Optional,
  ServiceKey,
  ServiceLifecycle,
  TweetId,
  UserId,
} from "./app.types";

// Core types from app.types re-exports
export type {
  DownloadOptions,
  GalleryConfig,
  GalleryEvents,
  GalleryState,
  GalleryViewMode,
  Lifecycle,
  Size,
  ViewMode,
} from "./core/core-types";

// Phase 421: ViewMode helpers removed; use VIEW_MODES from '@/constants'

// UI/theme types
export type {
  AnimationConfig,
  AsyncState,
  ButtonSize,
  ButtonVariant,
  ColorVariant,
  FilenameStrategy,
  GalleryTheme,
  GlobalConfig,
  ImageFitCallbacks,
  ImageFitMode,
  ImageFitOptions,
  LoadingState,
  MediaFileExtension,
  Theme,
} from "./ui.types";

// Component Props types
export type {
  BaseComponentProps,
  CSSProperties,
  ComponentChildren,
  ComponentType,
  ContainerComponentProps,
  EventHandler,
  FormComponentProps,
  GalleryComponentProps,
  InteractiveComponentProps,
  KeyboardEventHandler,
  LoadingComponentProps,
  MouseEventHandler,
  SizedComponentProps,
  VNode,
  VariantComponentProps,
} from "./component.types";

// Navigation state types
export type { NavigationSource } from "./navigation.types";

// Toolbar UI state types
export type {
  FitMode,
  ToolbarActions,
  ToolbarDataState,
  ToolbarState,
  ToolbarViewModel,
} from "./toolbar.types";

// Result pattern types (ErrorCode and Result related)
export type {
  BaseResult,
  BaseResultStatus,
  ErrorCode,
  Result,
  ResultError,
  ResultPartial,
  ResultSuccess,
} from "./result.types";

// Result utility functions (Phase 355.2)
export {
  cancelled,
  chain,
  failure,
  isFailure,
  isPartial,
  isSuccess,
  map,
  partial,
  safe,
  safeAsync,
  success,
  unwrapOr,
} from "./result.types";

// UserScript API types (re-exported directly from userscript definition)
export type {
  BrowserEnvironment,
  UserScriptConnect,
  UserScriptGrant,
  UserScriptInfo,
  UserScriptMetadata,
  UserScriptRunAt,
} from "./core/userscript.d";
