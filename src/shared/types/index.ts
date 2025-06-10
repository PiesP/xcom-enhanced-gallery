/**
 * Shared Types Barrel Export
 *
 * 모든 공통 타입들을 중앙집중식으로 export합니다.
 * 중복 타입은 명시적으로 re-export하여 충돌을 방지합니다.
 */

// Global types - Size 충돌 방지를 위해 명시적 export
export type {
  ApiError,
  ApiResponse,
  AsyncCallback,
  AsyncErrorHandler,
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
  OptionalCallback,
  PaginationInfo,
  Position,
  ProgressCallback,
  RequestOptions,
  TouchEventHandler,
  TweetId,
  UserId,
} from './global.types';

// Global types의 Size는 GeometrySize로 alias
export type { Size as GeometrySize, Rect } from './global.types';

// Image fit types
export * from './image-fit.types';

// Media types
export * from './media.types';

// UI types (Size 포함)
export * from './ui.types';

// View mode types (from core layer)
export {
  getDefaultViewMode,
  isValidViewMode,
  normalizeViewMode,
} from '@core/types/view-mode.types';
export type { VIEW_MODES, ViewMode } from '@core/types/view-mode.types';
