/**
 * Shared Types Barrel Export
 *
 * Phase 1A: 타입 파일 통합 단순화
 * 작은 타입 파일들을 unified.types.ts로 통합하고 중복 제거
 */

// Core global types
export type {
  ApiError,
  ApiResponse,
  AsyncCallback,
  AsyncFunction,
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

// Unified specialized types (Phase 2.2 Integration - includes branded types)
export * from './unified.types';
export * from './result';

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
