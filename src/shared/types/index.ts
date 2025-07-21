/**
 * Shared Types Barrel Export
 *
 * Phase 2B Step 2: 공통 타입들을 단순화하여 export
 * 중복 제거 및 핵심 타입들만 선별적으로 제공
 */

// Core global types
export type {
  ApiError,
  ApiResponse,
  AsyncCallback,
  AsyncFunction,
  BaseComponentProps,
  Brand,
  ComponentChildren,
  ComponentType,
  DeepPartial,
  ErrorHandler,
  EventHandler,
  FileInfo,
  GallerySignals,
  GlobalConfig,
  KeyboardEventHandler,
  LoadingState,
  MediaId,
  MouseEventHandler,
  Nullable,
  Optional,
  PaginationInfo,
  Position,
  ProgressCallback,
  RequestOptions,
  TweetId,
  UserId,
  Size,
  Rect,
} from './global.types';

// Specialized types
export * from './image-fit.types';
export * from './ui.types';
export * from './filename.types';
export * from './branded';
export * from './result';
export * from './vendor.types';

// View mode types (from core)
export { isValidViewMode, normalizeViewMode } from '@core/types/core-types';

// Core media types (Phase 1A - direct access)
export type { MediaInfo, MediaType, MediaItem } from '@core/types/media.types';
export type { VIEW_MODES, ViewMode } from '@core/types/core-types';

// Essential common types (no aliases needed)
export type {
  TimestampedEntity,
  IdentifiableEntity,
  Lifecycle,
  AsyncState,
  BaseEvent,
  BaseConfig,
} from './common.types';
