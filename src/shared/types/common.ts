/**
 * 공통 타입 정의 - Phase 1A 통합
 * X.com Enhanced Gallery에서 사용되는 기본 타입들을 통합 관리
 */

// 실제 타입 정의는 common.types.ts에서 가져옴
export * from './common.types';

// Core 레이어 타입 재export (하위 호환성)
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
