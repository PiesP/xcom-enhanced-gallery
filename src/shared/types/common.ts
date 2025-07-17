/**
 * 공통 타입 정의
 * X.com Enhanced Gallery에서 사용되는 기본 타입들
 *
 * Note: Core 레이어에서 사용하는 타입들은 core/types/core.types.ts로 이동됨
 */

// Re-export core types for backward compatibility
export type {
  MediaItem,
  GalleryConfig,
  ThemeConfig,
  DownloadOptions,
  Point,
  Size,
  EventHandler,
  AsyncEventHandler,
  CancelableFunction,
  LoadingState,
  ErrorInfo,
} from '../../core/types/core.types';
