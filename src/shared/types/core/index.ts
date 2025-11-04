/**
 * @fileoverview Core Types - Infrastructure layer 타입 export
 * @version 4.0.0 - Phase 352: Named export 최적화
 *
 * **역할**:
 * - 핵심 도메인 타입 (Result, BaseService 등)
 * - 미디어 추출 타입 (backward compatibility)
 * - UserScript API 타입 정의
 *
 * **다른 import 경로**:
 * - `@shared/types`: 전체 타입 (권장)
 * - `@shared/types/media.types`: 미디어 타입만
 * - `@shared/types/result.types`: Result 패턴만
 */

// Phase 352: Explicit named exports from core-types
export type { BaseService } from './core-types';
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
} from './core-types';

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
} from './core-types';

// UserScript API types
export type {
  UserScriptInfo,
  BrowserEnvironment,
  UserScriptGrant,
  UserScriptConnect,
  UserScriptRunAt,
  UserScriptMetadata,
} from './userscript.d';

// Backward compatibility: extraction types (실제는 media.types에 정의됨)
export type {
  TweetInfo,
  MediaExtractionOptions,
  MediaExtractor,
  TweetInfoExtractionStrategy,
  APIExtractor,
  FallbackExtractionStrategy,
  MediaExtractionResult,
} from './extraction.types';

export { ExtractionError, ExtractionErrorCode } from './extraction.types';
