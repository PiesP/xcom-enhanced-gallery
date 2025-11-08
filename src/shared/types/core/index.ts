/**
 * @fileoverview Core Types - Infrastructure layer type export
 * @version 4.0.0 - Phase 352: Named export optimization
 *
 * **Role**:
 * - Core domain types (Result, BaseService, etc)
 * - Media extraction types (backward compatibility)
 * - UserScript API type definitions
 *
 * **Alternative import paths**:
 * - `@shared/types`: All types (recommended)
 * - `@shared/types/media.types`: Media types only
 * - `@shared/types/result.types`: Result pattern only
 */

// Phase 352: Explicit named exports from core-types
export type { BaseService } from './core-types';
export type {
  ServiceLifecycle,
  GalleryViewMode,
  GalleryState,
  GalleryEvents,
  ViewMode,
  GalleryConfig,
  DownloadOptions,
  Size,
  AppConfig,
  Cleanupable,
  Lifecycle,
  Result,
  AsyncResult,
  Option,
} from './core-types';

// Re-exports from other modules (Phase 367)
export type { EventHandler } from '../component.types';
export type { LoadingState } from '../ui.types';

// Phase 421: ViewMode helpers removed; rely on VIEW_MODES from '@/constants'

// Result utilities are now in result.types.ts (Phase 355.2)
// Re-export for backward compatibility
export {
  success,
  failure,
  safeAsync,
  safe,
  unwrapOr,
  isSuccess,
  isFailure,
  chain,
} from '../result.types';

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

export { ExtractionError } from './extraction.types';
// ExtractionErrorCode was removed in Phase 353 - use ErrorCode instead
