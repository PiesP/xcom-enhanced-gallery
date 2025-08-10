/**
 * Core Types - Integrated Types for Userscript Simplification
 *
 * @version 1.1.0 - Phase 1 Type Integration
 * @description Core 레이어의 모든 타입 파일들을 통합하여 복잡성을 줄입니다.
 *
 * 통합된 타입들:
 * - core.types.ts (기본 Core 타입들)
 * - services.types.ts (서비스 관련 타입들)
 * - gallery.types.ts (갤러리 도메인 타입들)
 * - view-mode.types.ts (뷰 모드 관련)
 * - app.types.ts (애플리케이션 타입들)
 */

import type { MediaInfo } from './media.types';

// ========================================
// SERVICE TYPES (from services.types.ts)
// ========================================

/**
 * 기본 서비스 인터페이스 (app.types.ts에서 가져옴)
 */
import type { BaseService } from '@shared/types/app.types';

/**
 * 서비스 생명주기 상태
 */
export type ServiceLifecycle = 'uninitialized' | 'initializing' | 'initialized' | 'destroyed';

/**
 * @fileoverview Core 타입 정의
 * @description Phase 1: 통합 타입 사용으로 전환 완료
 * @version 2.0.0 - 타입 통합 완료
 */

// ========================================
// UNIFIED TYPES RE-EXPORTS
// ========================================

/**
 * 통합된 타입들을 re-export하여 기존 코드와의 호환성 보장
 * 모든 공통 타입들은 @shared/types/unified에서 관리됩니다.
 */
export type {
  AppConfig,
  ServiceConfig,
  Cleanupable,
  Disposable,
  Destroyable,
  Lifecycle,
  BaseService,
  BaseConfig,
  AnimationConfig,
  GalleryConfig,
  ThemeConfig,
  Point,
  Size,
  EventHandler,
  AsyncEventHandler,
  LifecycleConfig,
} from '../unified';

// ========================================
// CORE-SPECIFIC LEGACY TYPES
// ========================================

/**
 * 서비스 의존성 및 팩토리 타입들
 */
export type ServiceDependency = string;
export type ServiceFactory<T> = () => T | Promise<T>;

/**
 * 서비스 타입 매핑 (Infrastructure 서비스들)
 */
export type BulkDownloadServiceType = import('../../services/media-service').MediaService;
export type FilenameServiceType = import('../../media').FilenameService;
export type ThemeServiceType = import('../../services/theme-service').ThemeService;
// VideoControlService는 MediaService로 통합됨
// export type VideoControlServiceType = import('../../services/media/VideoControlService').VideoControlService;
export type ToastControllerType = import('../../services/toast-service').ToastService;

/**
 * 갤러리 렌더러 서비스 타입
 */
export interface GalleryRendererType extends BaseService {
  render(mediaItems: readonly unknown[], renderOptions?: unknown): Promise<void>;
  close?(): void;
  isRendering?(): boolean;
  setOnCloseCallback?(callback: () => void): void;
}

/**
 * 다운로드 매니저 서비스 타입
 */
export interface DownloadManagerType extends BaseService {
  getInstance?(): DownloadManagerType;
  downloadAll(items: unknown[]): Promise<void>;
}

/**
 * 미디어 추출 서비스 타입
 */
// MediaExtractionService는 MediaService로 통합됨
// export interface MediaExtractionServiceType extends BaseService {
//   extractMediaFromTweet(element: HTMLElement): Promise<MediaInfo[]>;
//   extractSingleMedia(element: HTMLElement): Promise<MediaInfo | null>;
//   getInstance?(): MediaExtractionServiceType;
// }

/**
 * 갤러리 앱 서비스 타입
 */
export interface GalleryAppType extends BaseService {
  initialize(): Promise<void>;
  destroy(): void;
}

// ServiceTypeMapping 제거됨 - Phase 4 Step 4: 과도한 추상화 제거

// ========================================
// GALLERY TYPES (from gallery.types.ts)
// ========================================

/**
 * 갤러리 뷰 모드 타입
 */
export type GalleryViewMode = 'grid' | 'carousel' | 'slideshow';

/**
 * 갤러리 상태 인터페이스 (불변성 보장)
 */
export interface GalleryState {
  readonly isOpen: boolean;
  readonly currentIndex: number;
  readonly items: readonly MediaInfo[];
  readonly viewMode: GalleryViewMode;
  readonly isFullscreen: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
}

/**
 * 갤러리 액션 인터페이스 (Clean Architecture)
 */
export interface GalleryActions {
  open(items: MediaInfo[], startIndex?: number): void;
  close(): void;
  next(): void;
  previous(): void;
  goToIndex(index: number): void;
  setViewMode(mode: GalleryViewMode): void;
  toggleFullscreen(): void;
  setLoading(isLoading: boolean): void;
  setError(error: string | null): void;
}

/**
 * 갤러리 설정 인터페이스 (Gallery Domain specific)
 */
export interface GalleryDomainConfig {
  readonly autoPlay: boolean;
  readonly loopNavigation: boolean;
  readonly keyboardNavigation: boolean;
  readonly showThumbnails: boolean;
  readonly animationDuration: number;
  readonly maxZoomLevel: number;
}

/**
 * 갤러리 이벤트 타입
 */
export type GalleryEvents = {
  'gallery:open': { items: MediaInfo[]; startIndex: number };
  'gallery:close': {};
  'gallery:navigate': { index: number; item: MediaInfo };
  'gallery:viewModeChange': { mode: GalleryViewMode };
  'gallery:fullscreenToggle': { isFullscreen: boolean };
  'gallery:error': { error: string };
};

/**
 * 갤러리 생명주기 단계
 */
export type GalleryLifecycleState =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'opening'
  | 'open'
  | 'closing'
  | 'error'
  | 'destroyed';

/**
 * 갤러리 초기화 옵션
 */
export interface GalleryInitOptions {
  readonly container?: HTMLElement;
  readonly config?: Partial<GalleryDomainConfig>;
  readonly onError?: (error: string) => void;
}

// ========================================
// VIEW MODE TYPES (from view-mode.types.ts)
// ========================================

// Re-export from constants for better organization
export { VIEW_MODES, isValidViewMode, normalizeViewMode, type ViewMode } from '@/constants';

// ========================================
// CORE UTILITY TYPES
// ========================================

/**
 * Re-export utility types from core.types.ts to avoid duplication
 */
export type { MediaItem } from './media.types';

// ========================================
// MEDIA MAPPING TYPES (from media-mapping/types.ts)
// ========================================

import type { MediaMapping, MediaPageType } from './media.types';

/**
 * 미디어 매핑 전략 인터페이스
 */
export interface MediaMappingStrategy {
  /** 전략의 고유 이름 */
  readonly name: string;

  /** 우선순위 (낮을수록 먼저 실행) */
  readonly priority: number;

  /**
   * 미디어 매핑 실행
   * @param clickedElement 클릭된 요소
   * @param pageType 페이지 타입
   * @returns 매핑 결과 또는 null
   */
  execute(clickedElement: HTMLElement, pageType: MediaPageType): Promise<MediaMapping | null>;
}

/**
 * 전략 메트릭스
 */
export interface StrategyMetrics {
  successRate: number;
  avgProcessingTime: number;
  lastUsed: number;
  priority: number;
}

/**
 * 매핑 캐시 엔트리
 */
export interface MappingCacheEntry {
  result: MediaMapping;
  timestamp: number;
}

// ========================================
// CORE FOUNDATION TYPES (from core.types.ts)
// ========================================

/**
 * 기본 갤러리 설정
 */
export interface GalleryConfig {
  /** 자동 재생 여부 */
  autoPlay: boolean;
  /** 썸네일 표시 여부 */
  showThumbnails: boolean;
  /** 다운로드 기능 활성화 여부 */
  downloadEnabled: boolean;
  /** 키보드 네비게이션 활성화 여부 */
  keyboardNavigation?: boolean;
  /** 풀스크린 모드 지원 여부 */
  fullscreenEnabled?: boolean;
  /** 이미지 확대/축소 기능 */
  zoomEnabled?: boolean;
}

/**
 * 테마 설정
 */
export interface ThemeConfig {
  /** 테마 모드 */
  mode: 'light' | 'dark' | 'auto';
  /** 색상 스킴 */
  colorScheme?: 'twitter' | 'minimal' | 'custom';
  /** 애니메이션 활성화 여부 */
  animationsEnabled?: boolean;
}

/**
 * 다운로드 옵션
 */
export interface DownloadOptions {
  /** 다운로드 품질 */
  quality?: 'original' | 'high' | 'medium';
  /** 파일명 형식 */
  filenameFormat?: string;
  /** 압축 활성화 여부 */
  compressionEnabled?: boolean;
}

/**
 * 기본 위치 좌표
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 크기 정보
 */
export interface Size {
  width: number;
  height: number;
}

/** 일반적인 이벤트 핸들러 타입 */
export type EventHandler<T = Event> = (event: T) => void;

/** 비동기 이벤트 핸들러 타입 */
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

/** 취소 가능한 함수 타입 */
export type CancelableFunction = () => void;

/** 로딩 상태 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/** 에러 정보 */
export interface ErrorInfo {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: Date;
}

// ========================================
// APPLICATION TYPES - Re-exported from unified
// ========================================

/**
 * 애플리케이션 설정 (통합된 버전)
 */
// export interface AppConfig - unified.ts에서 가져옴

/**
 * 애플리케이션 인스턴스 인터페이스
 */
export interface AppInstance {
  /** 초기화 */
  initialize(): Promise<void>;
  /** 정리 */
  cleanup?(): Promise<void>;
  /** 실행 상태 확인 */
  isRunning?(): boolean;
}

/**
 * 애플리케이션 상태
 */
export type ApplicationState = 'initializing' | 'running' | 'stopping' | 'stopped' | 'error';

/**
 * 애플리케이션 라이프사이클 상태
 */
export type AppLifecycleState = 'idle' | 'initializing' | 'ready' | 'error' | 'destroyed';

/**
 * 서비스 상태
 */
export type ServiceState =
  | 'registered'
  | 'initializing'
  | 'initialized'
  | 'destroying'
  | 'destroyed'
  | 'error';

/**
 * 애플리케이션 메타데이터
 */
export interface ApplicationMetadata {
  /** 애플리케이션 이름 */
  name: string;
  /** 버전 */
  version: string;
  /** 빌드 시간 */
  buildTime?: string;
  /** 환경 정보 */
  environment: 'development' | 'production' | 'test';
}

/**
 * 성능 메트릭
 */
export interface PerformanceMetrics {
  /** 초기화 시간 (ms) */
  initializationTime: number;
  /** 메모리 사용량 */
  memoryUsage: {
    /** 힙 사용량 */
    usedJSHeapSize?: number;
    /** 총 힙 크기 */
    totalJSHeapSize?: number;
    /** 힙 크기 제한 */
    jsHeapSizeLimit?: number;
  };
  /** 서비스 수 */
  serviceCount: {
    /** 등록된 서비스 수 */
    registered: number;
    /** 초기화된 서비스 수 */
    initialized: number;
  };
  /** 최적화 설정 */
  optimizations?: {
    memoryMonitoring?: boolean;
    performanceProfiling?: boolean;
  };
}

/**
 * 생명주기 설정 옵션
 */
export interface LifecycleConfig {
  autoStart: boolean;
  retryCount: number;
  timeout: number;
}

// ========================================
// LIFECYCLE TYPES - Re-exported from unified
// ========================================

/**
 * 동기적 정리 인터페이스
 */
// export interface Cleanupable - unified.ts에서 가져옴

/**
 * 비동기적 정리 인터페이스
 */
// export interface Disposable - unified.ts에서 가져옴

/**
 * 완전한 소멸 인터페이스
 */
// export interface Destroyable - unified.ts에서 가져옴

/**
 * 통합 생명주기 인터페이스
 */
// export interface Lifecycle - unified.ts에서 가져옴

// ========================================
// RESULT TYPES (from result.ts)
// ========================================

/**
 * Result 타입 - 성공 또는 실패를 명시적으로 표현
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * 비동기 Result 타입
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Option 타입 - 값이 있거나 없음을 명시적으로 표현
 */
export type Option<T> = T | null;

/**
 * 성공 Result 생성
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * 실패 Result 생성
 */
export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * 비동기 함수를 안전하게 실행하고 Result 반환
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorTransform?: (error: unknown) => Error
): AsyncResult<T> {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    const processedError = errorTransform
      ? errorTransform(error)
      : error instanceof Error
        ? error
        : new Error(String(error));
    return failure(processedError);
  }
}

/**
 * 동기 함수를 안전하게 실행하고 Result 반환
 */
export function safe<T>(fn: () => T, errorTransform?: (error: unknown) => Error): Result<T> {
  try {
    const data = fn();
    return success(data);
  } catch (error) {
    const processedError = errorTransform
      ? errorTransform(error)
      : error instanceof Error
        ? error
        : new Error(String(error));
    return failure(processedError);
  }
}

/**
 * Result에서 값을 추출 (기본값 제공)
 */
export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  return result.success ? result.data : defaultValue;
}

/**
 * Result가 성공인지 확인
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Result가 실패인지 확인
 */
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Result 체이닝 (flatMap)
 */
export function chain<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return result.success ? fn(result.data) : result;
}

/**
 * Result 매핑 (map)
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.success ? success(fn(result.data)) : result;
}
