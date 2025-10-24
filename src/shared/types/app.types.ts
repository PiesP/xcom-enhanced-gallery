/**
 * @fileoverview 통합 앱 전역 타입 정의
 * @version 3.0.0 - Phase 3: 파일 통합
 *
 * 모든 앱 전역 타입을 하나로 통합:
 * - core-types.ts (서비스, Result 타입)
 * - common.types.ts (공통 기본 타입)
 * - global.types.ts (글로벌 타입)
 * - app.types.ts (앱 특화 타입)
 */

import type { JSXElement } from '@shared/external/vendors';
import type {
  BulkDownloadServiceType,
  FilenameServiceType,
  ThemeServiceType,
  VideoControlServiceType,
  ToastControllerType,
} from './core/core-types';

// ================================
// 기본 서비스 인터페이스
// ================================

/**
 * 기본 서비스 인터페이스를 core-types에서 re-export
 * @see {@link ./core/core-types.ts} - 단일 진실 소스 (Single Source of Truth)
 */
export type { BaseService } from './core/core-types';

/**
 * 정리 가능한 리소스 인터페이스
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
// Result 패턴 타입들
// ================================

/**
 * Result 패턴 관련 타입 및 함수들을 core-types에서 re-export
 * @see {@link ./core/core-types.ts} - 단일 진실 소스 (Single Source of Truth)
 */
export type { Result, AsyncResult } from './core/core-types';
export type Option<T> = T | null;

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
 * 서비스 타입 매핑 (상세 타입은 core-types.ts 참조)
 */
export interface ServiceTypeMapping {
  'core.bulkDownload': BulkDownloadServiceType;
  'media.filename': FilenameServiceType;
  'theme.auto': ThemeServiceType;
  'toast.controller': ToastControllerType;
  'video.control': VideoControlServiceType;
  [key: string]: unknown;
}

// ================================
// 갤러리 관련 타입들
// ================================

/**
 * 갤러리 뷰 모드
 */
export type GalleryViewMode = 'grid' | 'carousel' | 'slideshow';

/**
 * 뷰 모드 상수
 */
export const VIEW_MODES = ['horizontal', 'vertical'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export function isValidViewMode(mode: unknown): mode is ViewMode {
  return typeof mode === 'string' && VIEW_MODES.includes(mode as ViewMode);
}

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

// ================================
// 공통 기본 타입들
// ================================

/**
 * 위치/크기 타입
 */
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Position, Size {}

/**
 * 엔티티 기본 타입
 */
export interface TimestampedEntity {
  timestamp: number;
}

export interface IdentifiableEntity {
  id: string;
}

/**
 * 라이프사이클 관리
 */
export interface Lifecycle {
  cleanup(): void;
  destroy(): void;
}

/**
 * 상태 관련 타입
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * 이벤트 관련 타입
 */
export interface BaseEvent {
  type: string;
  timestamp: number;
}

/**
 * 설정 관련 타입
 */
export interface BaseConfig {
  enabled: boolean;
  version?: string;
}

// ================================
// Preact/React 타입들
// ================================

export type VNode = JSXElement;

export type ComponentType<P = Record<string, unknown>> = (props: P) => JSXElement | null;

export type ComponentChildren =
  | JSXElement
  | string
  | number
  | boolean
  | null
  | undefined
  | ComponentChildren[];

export interface CSSProperties {
  [key: string]: string | number | undefined;
}

export interface BaseComponentProps {
  children?: ComponentChildren;
  className?: string;
  style?: CSSProperties;
  [key: `data-${string}`]: string | number | boolean | undefined;
}

// ================================
// 이벤트 핸들러 타입들
// ================================

export type EventHandler<T = Event> = (event: T) => void;
export type MouseEventHandler = EventHandler<MouseEvent>;
export type KeyboardEventHandler = EventHandler<KeyboardEvent>;
export type AsyncFunction<T = void> = () => Promise<T>;
export type AsyncCallback<T = void, R = void> = (arg: T) => Promise<R>;
export type OptionalCallback<T = void> = ((arg: T) => void) | undefined;
export type ErrorHandler = (error: Error | ApiError) => void;
export type AsyncErrorHandler = (error: Error | ApiError) => Promise<void>;
export type ProgressCallback = (progress: number) => void;

// ================================
// API 관련 타입들
// ================================

export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

// ================================
// 유틸리티 타입들
// ================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Brand<T, B> = T & { __brand: B };

// 브랜드 타입들 (MediaId는 media.types.ts에서 정의되므로 제외)
export type UserId = Brand<string, 'UserId'>;
export type TweetId = Brand<string, 'TweetId'>;
export type ServiceKey = Brand<string, 'ServiceKey'>;
export type ElementId = Brand<string, 'ElementId'>;
export type MediaUrl = Brand<string, 'MediaUrl'>;
export type ThumbnailUrl = Brand<string, 'ThumbnailUrl'>;
export type OriginalUrl = Brand<string, 'OriginalUrl'>;
export type FileName = Brand<string, 'FileName'>;
export type FileExtension = Brand<string, 'FileExtension'>;

// ================================
// UI/UX 관련 타입들
// ================================

export type Theme = 'light' | 'dark' | 'auto';
export type GalleryTheme = 'light' | 'dark' | 'auto' | 'system';
export type ToastType = 'info' | 'warning' | 'error' | 'success';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
}

export type ImageFitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';

export interface ImageFitOptions {
  mode: ImageFitMode;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  callbacks?: ImageFitCallbacks;
}

export interface ImageFitCallbacks {
  onResize?: (size: Size) => void;
  onError?: (error: Error) => void;
}

// ================================
// 파일명 관련 타입들
// ================================

export type MediaFileExtension = 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp' | 'mp4' | 'mov';
export type FilenameStrategy = 'simple' | 'detailed' | 'timestamp' | 'custom';

export interface FilenameValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions?: string[];
}

// ================================
// 글로벌 설정
// ================================

export interface GlobalConfig {
  theme: Theme;
  language: string;
  debug: boolean;
  performance: {
    enableMetrics: boolean;
    maxCacheSize: number;
  };
}

export interface GallerySignals {
  gallery: unknown;
  download: unknown;
  toolbar: unknown;
}
