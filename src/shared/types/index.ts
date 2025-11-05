/**
 * Shared Types Barrel Export
 *
 * @fileoverview 전체 타입 생태계의 단일 import 지점
 * @version 6.0.0 - Phase 352: Named export 최적화
 *
 * **구조**:
 * ```
 * types/
 * ├── index.ts (현재) - 배럴 export
 * ├── app.types.ts - 앱 전역 타입 + 재-export 허브
 * ├── ui.types.ts - UI/테마 타입
 * ├── component.types.ts - 컴포넌트 Props/이벤트
 * ├── media.types.ts - 미디어 관련 타입
 * ├── result.types.ts - Result 패턴 & ErrorCode
 * ├── navigation.types.ts - 네비게이션 타입
 * └── core/ - 핵심 도메인 & 인프라
 *     ├── core-types.ts - 핵심 타입들
 *     ├── base-service.types.ts - BaseService (순환 의존성 방지)
 *     ├── extraction.types.ts - 추출 타입 (backward compat)
 *     ├── userscript.d.ts - UserScript API
 *     └── index.ts - core 배럴
 * ```
 *
 * **사용 가이드**:
 * - 일반적인 경우: `import type { ... } from '@shared/types'`
 * - 세부 타입이 필요한 경우: `import type { ... } from '@shared/types/media.types'`
 * - Result 패턴만: `import { success, failure } from '@shared/types/core/core-types'`
 */

// ==========================================
// Phase 352: Explicit Named Exports
// ==========================================

// 미디어 관련 타입들 (가장 많이 사용되는 것들만 명시)
export type { MediaType, MediaQuality } from '@/constants';
export type {
  MediaInfo,
  MediaEntity,
  MediaId,
  TweetInfo,
  QuoteTweetInfo,
  MediaExtractionOptions,
  MediaExtractionResult,
  ExtractionSource,
  PageType,
  ExtractionOptions,
  ExtractionMetadata,
  ExtractionContext,
  MediaExtractor,
  TweetInfoExtractionStrategy,
  APIExtractor,
  FallbackExtractionStrategy,
  DownloadMediaItem,
  BulkDownloadOptions,
  GalleryRenderOptions,
  GalleryOpenEventDetail,
  GalleryOpenEvent,
  GalleryCloseEvent,
  MediaCollection,
  MediaPageType,
  ExtractionStrategy,
  MediaMapping,
  MediaMappingStrategy,
  ValidationIssue,
  ValidationResult,
  MediaValidationResult,
  MediaMetadata,
  MediaInfoForFilename,
  MediaItemForFilename,
  MediaInfoWithFilename,
  TweetUrl,
  UrlWithFilename,
  ExtractionConfidence,
} from './media.types';

export {
  PageType as MediaPageTypeEnum,
  ExtractionSource as ExtractionSourceEnum,
} from './media.types';

// 앱 전역 타입들 (Phase 355.2: Result 타입 제거, result.types로 이동)
export type {
  AppConfig,
  Cleanupable,
  AsyncResult,
  BaseService,
  ServiceLifecycle,
  Option,
  Nullable,
  Optional,
  DeepPartial,
  UserId,
  TweetId,
  ServiceKey,
  ElementId,
  MediaUrl,
} from './app.types';

// Core types from app.types re-exports
export type {
  ViewMode,
  GalleryViewMode,
  GalleryState,
  GalleryEvents,
  StrategyMetrics,
  MappingCacheEntry,
  GalleryConfig,
  DownloadOptions,
  Size,
  Lifecycle,
} from './core/core-types';

export { VIEW_MODES, isValidViewMode } from './core/core-types';

// UI/테마 타입들
export type {
  Theme,
  GalleryTheme,
  ToastType,
  ButtonVariant,
  ButtonSize,
  ColorVariant,
  LoadingState,
  AsyncState,
  AnimationConfig,
  ImageFitMode,
  ImageFitOptions,
  ImageFitCallbacks,
  FilenameStrategy,
  MediaFileExtension,
  GlobalConfig,
} from './ui.types';

// 컴포넌트 Props 타입들
export type {
  VNode,
  ComponentType,
  ComponentChildren,
  CSSProperties,
  BaseComponentProps,
  InteractiveComponentProps,
  LoadingComponentProps,
  SizedComponentProps,
  VariantComponentProps,
  FormComponentProps,
  ContainerComponentProps,
  GalleryComponentProps,
  EventHandler,
  MouseEventHandler,
  KeyboardEventHandler,
} from './component.types';

// 네비게이션 상태 타입들
export type { NavigationSource } from './navigation.types';

// 툴바 UI 상태 타입들
export type { ToolbarDataState, FitMode, ToolbarState, ToolbarActions } from './toolbar.types';

// Result 패턴 타입들 (ErrorCode와 Result 관련)
export type {
  BaseResultStatus,
  ErrorCode,
  BaseResult,
  ResultSuccess,
  ResultPartial,
  ResultError,
  Result,
} from './result.types';

// Result 유틸리티 함수들 (Phase 355.2)
export {
  success,
  failure,
  partial,
  cancelled,
  isSuccess,
  isFailure,
  isPartial,
  unwrapOr,
  safe,
  safeAsync,
  chain,
  map,
} from './result.types';

// Result 호환성 레이어 (Phase 355.2)
export {
  toEnhancedResult,
  toSimpleResult,
  toEnhancedResults,
  toSimpleResults,
} from './result-compat';

// UserScript API 타입들 (core/index.ts에서 재export)
export type {
  UserScriptInfo,
  BrowserEnvironment,
  UserScriptGrant,
  UserScriptConnect,
  UserScriptRunAt,
  UserScriptMetadata,
} from './core/userscript.d';
