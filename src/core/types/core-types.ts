/**
 * Core Types - Integrated Types for Userscript Simplification
 *
 * @version 1.0.0 - Phase 1 Type Integration
 * @description Core 레이어의 작은 타입 파일들을 통합하여 복잡성을 줄입니다.
 *
 * 통합된 타입들:
 * - services.types.ts (서비스 관련 타입들)
 * - gallery.types.ts (갤러리 도메인 타입들)
 * - view-mode.types.ts (뷰 모드 관련)
 */

import type { MediaInfo } from './media.types';

// ========================================
// SERVICE TYPES (from services.types.ts)
// ========================================

/**
 * 기본 서비스 인터페이스
 */
export interface BaseService {
  destroy?(): void;
  initialize?(): Promise<void> | void;
  isInitialized?(): boolean;
}

/**
 * 서비스 생명주기 상태
 */
export type ServiceLifecycle = 'uninitialized' | 'initializing' | 'initialized' | 'destroyed';

/**
 * 서비스 설정
 */
export interface ServiceConfig<T = unknown> {
  factory: () => T | Promise<T>;
  singleton?: boolean;
  dependencies?: string[];
  lazy?: boolean;
}

/**
 * 서비스 의존성 타입
 */
export type ServiceDependency = string;
export type ServiceFactory<T> = () => T | Promise<T>;

/**
 * 서비스 타입 매핑 (Infrastructure 서비스들)
 */
export type BulkDownloadServiceType = import('../services/BulkDownloadService').BulkDownloadService;
export type FilenameServiceType = import('../../infrastructure/media').FilenameService;
export type ThemeServiceType = import('../services/ThemeService').ThemeService;
export type VideoControlServiceType =
  import('../services/media/VideoControlService').VideoControlService;
export type ToastControllerType = import('../services/ToastController').ToastController;

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
export interface MediaExtractionServiceType extends BaseService {
  extractMediaFromElement?(element: Element): Promise<unknown>;
  extractMedia?(element: Element, options?: unknown): Promise<unknown>;
  getInstance?(): MediaExtractionServiceType;
}

/**
 * 갤러리 앱 서비스 타입
 */
export interface GalleryAppType extends BaseService {
  initialize(): Promise<void>;
  destroy(): void;
}

/**
 * 서비스 타입 매핑 (서비스 레지스트리에서 사용)
 */
export interface ServiceTypeMapping {
  'core.bulkDownload': BulkDownloadServiceType;
  gallery: unknown; // GalleryAppType - features layer 타입이므로 unknown 사용
  'gallery.renderer': unknown; // GalleryRendererType - features layer 타입이므로 unknown 사용
  'gallery.download': unknown; // DownloadManagerType - features layer 타입이므로 unknown 사용
  'media.extraction': unknown; // MediaExtractionServiceType - features layer 타입이므로 unknown 사용
  'media.filename': FilenameServiceType;
  'theme.auto': ThemeServiceType;
  'toast.controller': ToastControllerType;
  'video.state': VideoControlServiceType;
  'video.control': VideoControlServiceType;
  'settings.manager': unknown; // Settings 관련 타입들은 features layer이므로 unknown 사용
  'settings.tokenExtractor': unknown; // Settings 관련 타입들은 features layer이므로 unknown 사용
}

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
export { VIEW_MODES, isValidViewMode, normalizeViewMode, type ViewMode } from '../../constants';

// ========================================
// CORE UTILITY TYPES
// ========================================

/**
 * Re-export utility types from core.types.ts to avoid duplication
 */
export type {
  ThemeConfig,
  DownloadOptions,
  Point,
  Size,
  EventHandler,
  AsyncEventHandler,
  CancelableFunction,
  LoadingState,
  ErrorInfo,
} from './core.types';

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
