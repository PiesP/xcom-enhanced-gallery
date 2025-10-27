/**
 * @fileoverview 통합 앱 전역 타입 정의
 * @version 4.0.0 - Phase 196: 타입 파일 분할
 *
 * 타입 파일 구조 (Phase 196):
 * - app.types.ts (현재): 핵심 앱 타입, 서비스, Result 패턴
 * - ui.types.ts: 테마, UI 상태, 애니메이션 (신규)
 * - component.types.ts: 컴포넌트 Props, 이벤트 핸들러 (신규)
 *
 * 이 파일은 Re-export 중심으로 구성하여 단일 import 지점을 제공합니다.
 */

// ================================
// 기본 앱 타입 정의
// ================================

/**
 * 정리 가능한 리소스 인터페이스
 *
 * @description 메모리/리소스 정리가 필요한 객체의 계약
 */
export interface Cleanupable {
  /**
   * 동기적 정리 (메모리, 타이머, 이벤트 리스너 등)
   */
  cleanup(): void;
}

/**
 * 애플리케이션 설정
 */
export interface AppConfig {
  /** 애플리케이션 버전 */
  version: string;
  /** 개발 모드 여부 */
  isDevelopment: boolean;
  /** 디버그 모드 여부 */
  debug: boolean;
  /** 자동 시작 여부 */
  autoStart: boolean;
  /** 성능 모니터링 활성화 여부 */
  performanceMonitoring?: boolean;
}

// ================================
// Result 패턴 타입들 (core-types에서 re-export)
// ================================

/**
 * Result 패턴 관련 타입 및 함수들을 core-types에서 re-export
 * @see {@link ./core/core-types.ts} - 단일 진실 소스 (Single Source of Truth)
 */
export type { Result, AsyncResult } from './core/core-types';
export type { BaseService } from './core/core-types';

// Result 유틸리티 함수들 re-export
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

/**
 * Option 타입 (T 또는 null)
 */
export type Option<T> = T | null;

// ================================
// 서비스 관련 타입들
// ================================

/**
 * 서비스 생명주기 상태
 */
export type ServiceLifecycle = 'uninitialized' | 'initializing' | 'initialized' | 'destroyed';

/**
 * 서비스 설정
 */
export interface ServiceConfig<T = unknown> {
  enabled: boolean;
  options?: T;
  dependencies?: ServiceDependency[];
}

export type ServiceDependency = string;
export type ServiceFactory<T> = () => T | Promise<T>;

/**
 * 기본 이벤트
 */
export interface BaseEvent {
  type: string;
  timestamp: number;
}

/**
 * 기본 설정 인터페이스
 */
export interface BaseConfig {
  enabled: boolean;
  version?: string;
}

/**
 * 라이프사이클 관리 인터페이스
 */
export interface Lifecycle {
  cleanup(): void;
  destroy(): void;
}

// ================================
// 공통 유틸리티 타입들
// ================================

/**
 * 위치/좌표
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 크기
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 사각형 (위치 + 크기)
 */
export interface Rect extends Position, Size {}

/**
 * 타임스탬프가 있는 엔티티
 */
export interface TimestampedEntity {
  timestamp: number;
}

/**
 * ID가 있는 엔티티
 */
export interface IdentifiableEntity {
  id: string;
}

// ================================
// Brand 타입 정의들
// ================================

/**
 * 브랜드 타입 기본 구조
 *
 * @template T 원본 타입
 * @template B 브랜드명
 * @description 컴파일 타임에만 존재하며, 런타임에는 string/number/etc.로 동작
 * @example
 * ```typescript
 * type UserId = Brand<string, 'UserId'>;
 * const userId = '123' as UserId;
 * ```
 */
type Brand<T, B> = T & { readonly __brand: B };

// Brand 타입들 (도메인별로 구분)

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
// 일반 유틸리티 타입들
// ================================

/**
 * Nullable 타입 (T 또는 null)
 *
 * @template T 기본 타입
 */
export type Nullable<T> = T | null;

/**
 * Optional 타입 (T 또는 undefined)
 *
 * @template T 기본 타입
 */
export type Optional<T> = T | undefined;

/**
 * 깊은 Partial (모든 중첩 속성을 선택사항으로)
 *
 * @template T 객체 타입
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ================================
// UI/UX 관련 타입들 (ui.types.ts re-export)
// ================================

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

// ================================
// 컴포넌트 관련 타입들 (component.types.ts re-export)
// ================================

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

// ================================
// 갤러리 관련 타입들
// ================================

/**
 * 갤러리 뷰 모드
 */
export type GalleryViewMode = 'grid' | 'carousel' | 'slideshow';

/**
 * 뷰 모드 (horizontal/vertical)
 */
export const VIEW_MODES = ['horizontal', 'vertical'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

/**
 * ViewMode 유효성 검사
 */
export function isValidViewMode(mode: unknown): mode is ViewMode {
  return typeof mode === 'string' && VIEW_MODES.includes(mode as ViewMode);
}

/**
 * ViewMode 정규화 (기본값: horizontal)
 */
export function normalizeViewMode(mode: string | undefined): ViewMode {
  return isValidViewMode(mode) ? mode : 'horizontal';
}

/**
 * 갤러리 상태
 */
export interface GalleryState {
  readonly isOpen: boolean;
  readonly mediaItems: readonly unknown[];
  readonly currentIndex: number;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly viewMode: ViewMode;
}

/**
 * 갤러리 액션들
 */
export interface GalleryActions {
  openGallery(items: unknown[], startIndex?: number): void;
  closeGallery(): void;
  navigateToItem(index: number): void;
  setViewMode(mode: ViewMode): void;
}

/**
 * 갤러리 이벤트들
 */
export type GalleryEvents = {
  'gallery:open': { items: unknown[]; startIndex: number };
  'gallery:close': Record<string, never>;
  'gallery:navigate': { index: number; item: unknown };
  'gallery:viewModeChange': { mode: GalleryViewMode };
  'gallery:fullscreenToggle': { isFullscreen: boolean };
  'gallery:error': { error: string };
};

/**
 * 신호 관련 타입들
 */
export interface GallerySignals {
  gallery: unknown;
  download: unknown;
  toolbar: unknown;
}
