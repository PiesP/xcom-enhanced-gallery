/**
 * 공통 타입 정의 - Phase 2.2 Integration
 * X.com Enhanced Gallery에서 사용되는 기본 타입들을 통합 관리
 *
 * unified.types.ts와 common.types.ts로 통합됨
 */

// 실제 타입 정의는 common.types.ts에서 가져옴
export * from './common.types';

// Branded types는 unified.types.ts에서 가져옴
export type {
  Brand,
  MediaId,
  UserId,
  TweetId,
  ServiceKey,
  ElementId,
  MediaUrl,
  ThumbnailUrl,
  OriginalUrl,
  FileName,
  FileExtension,
  Percentage,
  PixelValue,
  Timestamp,
  createMediaId,
  createUserId,
  createTweetId,
  createServiceKey,
  createElementId,
} from './unified.types';

// Core 레이어 타입 재export (하위 호환성) - unified.types.ts에서 관리 (Size 제외)
export type {
  MediaItem,
  GalleryConfig,
  ThemeConfig,
  DownloadOptions,
  Point,
  EventHandler,
  AsyncEventHandler,
  CancelableFunction,
  LoadingState,
  ErrorInfo,
} from './unified.types';
