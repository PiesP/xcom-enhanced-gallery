/**
 * @fileoverview Service Types
 * @version 1.0.0
 *
 * 모든 서비스 관련 타입 정의
 */

// Core service interfaces
export interface BaseService {
  destroy?(): void;
  initialize?(): Promise<void> | void;
  isInitialized?(): boolean;
}

// Service lifecycle
export type ServiceLifecycle = 'uninitialized' | 'initializing' | 'initialized' | 'destroyed';

// Service configuration
export interface ServiceConfig<T = unknown> {
  factory: () => T | Promise<T>;
  singleton?: boolean;
  dependencies?: string[];
  lazy?: boolean;
}

// Service dependency injection
export type ServiceDependency = string;
export type ServiceFactory<T> = () => T | Promise<T>;

// Import service class types for type safety
export type BulkDownloadServiceType = import('../services/BulkDownloadService').BulkDownloadService;
export type MediaFilenameServiceType = import('../../infrastructure/media').MediaFilenameService;
export type PageScrollLockManagerType =
  import('../../infrastructure/dom/ScrollLockService').ScrollLockService;
export type SimpleThemeManagerType = import('../services/AutoThemeService').SimpleThemeManager;
export type GalleryScrollProtectionServiceType =
  import('../services/GalleryScrollProtectionService').GalleryScrollProtectionService;

// Generic service interfaces for features and shared services
export interface GalleryRendererType extends BaseService {
  render(mediaItems: readonly unknown[], renderOptions?: unknown): Promise<void>;
  close?(): void;
  isRendering?(): boolean;
  setOnCloseCallback?(callback: () => void): void;
}

export interface GalleryDownloadServiceType extends BaseService {
  getInstance?(): GalleryDownloadServiceType;
  downloadAll(items: unknown[]): Promise<void>;
}

export interface MediaExtractionServiceType extends BaseService {
  extractMediaFromElement?(element: Element): Promise<unknown>;
  extractMedia?(element: Element, options?: unknown): Promise<unknown>;
  getInstance?(): MediaExtractionServiceType;
}

export interface UnifiedMediaExtractionServiceType extends BaseService {
  extractMedia(element: Element, options?: unknown): Promise<unknown>;
}

export interface GalleryScrollManagerType extends BaseService {
  getInstance?(): GalleryScrollManagerType;
  lockScroll(): void;
  unlockScroll(): void;
}

export interface VideoServiceType extends BaseService {
  getInstance?(): VideoServiceType;
  pauseAll(): void;
  resumeAll(): void;
}

export interface GalleryAppType extends BaseService {
  initialize(): Promise<void>;
  destroy(): void;
}

// Service registry mapping - 의존성 규칙 위반을 피하기 위해 unknown 사용
export interface ServiceTypeMapping {
  'core.bulkDownload': BulkDownloadServiceType;
  gallery: unknown; // GalleryAppType - features layer 타입이므로 unknown 사용
  'gallery.renderer': unknown; // GalleryRendererType - features layer 타입이므로 unknown 사용
  'gallery.download': unknown; // GalleryDownloadServiceType - features layer 타입이므로 unknown 사용
  'media.extraction': unknown; // MediaExtractionServiceType - features layer 타입이므로 unknown 사용
  'media.extraction.unified': unknown; // UnifiedMediaExtractionServiceType - features layer 타입이므로 unknown 사용
  'media.filename': MediaFilenameServiceType;
  'scroll.pageLock': PageScrollLockManagerType;
  'scroll.gallery': unknown; // GalleryScrollManagerType - shared layer 타입이므로 unknown 사용
  'scroll.galleryProtection': GalleryScrollProtectionServiceType;
  'theme.auto': SimpleThemeManagerType;
  'video.service': unknown; // VideoServiceType - shared layer 타입이므로 unknown 사용
}

// Service manager errors
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly serviceKey?: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class ServiceNotFoundError extends ServiceError {
  constructor(serviceKey: string) {
    super(`Service not found: ${serviceKey}`, serviceKey);
    this.name = 'ServiceNotFoundError';
  }
}

export class ServiceInitializationError extends ServiceError {
  constructor(serviceKey: string, cause?: Error) {
    super(`Failed to initialize service: ${serviceKey}`, serviceKey, cause);
    this.name = 'ServiceInitializationError';
  }
}
