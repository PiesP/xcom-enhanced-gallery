/**
 * @fileoverview 통합 타입 정의
 * @version 2.0.0 - Phase 352: Named export 최적화
 *
 * 핵심 타입들만 re-export합니다.
 * 배럴 export 패턴을 준수합니다.
 */

// 핵심 타입들 재export (Phase 352: Step 2에서 이미 최적화됨)
export type { BaseService } from '../shared/types/core';
export type {
  ServiceLifecycle,
  GalleryViewMode,
  GalleryState,
  GalleryEvents,
  ViewMode,
  MediaItem,
  MediaMappingStrategy,
  StrategyMetrics,
  MappingCacheEntry,
  GalleryConfig,
  DownloadOptions,
  Size,
  EventHandler,
  LoadingState,
  AppConfig,
  Cleanupable,
  Lifecycle,
  Result,
  AsyncResult,
  Option,
  UserScriptInfo,
  BrowserEnvironment,
  UserScriptGrant,
  UserScriptConnect,
  UserScriptRunAt,
  UserScriptMetadata,
  TweetInfo,
  MediaExtractionOptions,
  MediaExtractor,
  TweetInfoExtractionStrategy,
  APIExtractor,
  FallbackExtractionStrategy,
  MediaExtractionResult,
} from '../shared/types/core';

export {
  VIEW_MODES,
  isValidViewMode,
  success,
  failure,
  safeAsync,
  safe,
  unwrapOr,
  isSuccess,
  isFailure,
  chain,
  ExtractionError,
  ExtractionErrorCode,
} from '../shared/types/core';
