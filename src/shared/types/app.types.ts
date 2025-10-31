/**
 * @fileoverview 앱 전역 타입 - 통합 배럴 export 및 앱 레벨 타입 정의
 * @version 4.1.0 - Phase 197: 명확한 구조 개선
 *
 * **역할**:
 * - 전체 타입 생태계의 단일 import 지점 (`@shared/types`)
 * - 앱 레벨의 직접 정의 타입 (AppConfig, Brand 타입 등)
 * - 하위 타입 파일들의 재-export
 *
 * **포함 타입**:
 * - 코어 타입: Result, BaseService (core-types.ts 재-export)
 * - UI 타입: 테마, 버튼, 로딩 상태 (ui.types.ts 재-export)
 * - 컴포넌트 타입: Props, 이벤트 핸들러 (component.types.ts 재-export)
 * - 미디어 타입: MediaInfo, MediaItem (media.types.ts 재-export)
 * - 유틸리티: Brand 타입, Nullable, DeepPartial 등 (여기서 정의)
 *
 * **다른 import 지점**:
 * - 세부 타입이 필요하면: `@shared/types/media.types`, `@shared/types/ui.types` 등 직접 import
 */

// ================================
// 앱 레벨 기본 타입 정의
// ================================

/**
 * 애플리케이션 설정
 * @description 앱 초기화 시 필요한 전역 설정
 */
export interface AppConfig {
  readonly version: string;
  readonly isDevelopment: boolean;
  readonly debug: boolean;
  readonly autoStart: boolean;
  readonly performanceMonitoring?: boolean;
  /** 윈도우 load 이후에 갤러리 렌더링을 지연할지 여부 (기본 true, 테스트 모드 제외) */
  readonly renderAfterLoad?: boolean;
}

/**
 * 동기 정리 가능한 리소스 인터페이스
 * @description 메모리/리소스 정리가 필요한 객체의 계약
 */
export interface Cleanupable {
  cleanup(): void;
}

// ================================
// 핵심 타입 및 패턴 (재-export)
// ================================

// Result 패턴 - core-types에서 재-export
export type { Result, AsyncResult } from './core/core-types';
export {
  success,
  failure,
  isSuccess,
  isFailure,
  unwrapOr,
  map,
  chain,
  safe,
  safeAsync,
} from './core/core-types';

// BaseService 및 서비스 타입들
export type { BaseService } from './core/core-types';
export type { ServiceLifecycle } from './core/core-types';

/**
 * Option 타입 - T 또는 null
 */
export type Option<T> = T | null;

// ================================
// 유틸리티 타입
// ================================

/**
 * Nullable - T 또는 null
 */
export type Nullable<T> = T | null;

/**
 * Optional - T 또는 undefined
 */
export type Optional<T> = T | undefined;

/**
 * 깊은 Partial - 모든 중첩 속성을 선택사항으로
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ================================
// Brand 타입 (도메인별 타입 안정성)
// ================================

/**
 * Brand 타입 기본 구조
 * @template T 원본 타입
 * @template B 브랜드명
 * @description 컴파일 타임에만 존재, 런타입에는 T로 동작
 */
type Brand<T, B> = T & { readonly __brand: B };

/** 사용자 ID */
export type UserId = Brand<string, 'UserId'>;
/** 트윗 ID */
export type TweetId = Brand<string, 'TweetId'>;
/** 서비스 키 */
export type ServiceKey = Brand<string, 'ServiceKey'>;
/** 요소 ID */
export type ElementId = Brand<string, 'ElementId'>;
/** 미디어 URL */
export type MediaUrl = Brand<string, 'MediaUrl'>;
/** 썸네일 URL */
export type ThumbnailUrl = Brand<string, 'ThumbnailUrl'>;
/** 원본 URL */
export type OriginalUrl = Brand<string, 'OriginalUrl'>;
/** 파일명 */
export type FileName = Brand<string, 'FileName'>;
/** 파일 확장자 */
export type FileExtension = Brand<string, 'FileExtension'>;

// ================================
// 하위 타입 파일 재-export
// ================================

// UI/테마 타입
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

// 컴포넌트 타입
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
  AsyncFunction,
  AsyncCallback,
  OptionalCallback,
  ErrorHandler,
  AsyncErrorHandler,
  ProgressCallback,
  ApiResponse,
  ApiError,
  RequestOptions,
  PaginationInfo,
  FileInfo,
} from './component.types';

// 미디어 타입
export type {
  MediaType,
  MediaQuality,
  MediaId,
  MediaInfo,
  MediaEntity,
  MediaItem,
  MediaInfoForFilename,
  MediaItemForFilename,
  MediaInfoWithFilename,
  TweetInfo,
  MediaExtractionOptions,
  MediaExtractionResult,
  TweetInfoExtractionStrategy,
  MediaExtractor,
  PageType,
  ExtractionSource,
} from './media.types';

export { ExtractionError } from './media.types';

// 네비게이션 타입
export type { NavigationSource } from './navigation.types';

// 툴바 UI 상태 타입
export type { ToolbarDataState, FitMode, ToolbarState, ToolbarActions } from './toolbar.types';

// Result 및 에러 코드
export type { BaseResultStatus, BaseResult, ResultSuccess, ResultError } from './result.types';
export { ErrorCode } from './result.types';

// 갤러리 타입 (core-types에서 재-export)
export type { GalleryViewMode } from './core/core-types';
export { VIEW_MODES, type ViewMode, isValidViewMode } from './core/core-types';
