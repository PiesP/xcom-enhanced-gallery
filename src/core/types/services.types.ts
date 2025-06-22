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
export type BulkDownloadServiceType =
  import('@core/services/BulkDownloadService').BulkDownloadService;
export type GalleryRendererType = import('@features/gallery/GalleryRenderer').GalleryRenderer;
export type GalleryDownloadServiceType =
  import('@features/gallery/services/GalleryDownloadService').GalleryDownloadService;
export type MediaExtractionServiceType =
  import('@features/media/services/MediaExtractionService').MediaExtractionService;
export type MediaFilenameServiceType = import('@infrastructure/media').MediaFilenameService;

// Manager types
export type PageScrollLockManagerType =
  import('@infrastructure/dom/ScrollLockService').ScrollLockService;
export type GalleryScrollManagerType =
  import('@shared/utils/core/dom/gallery-scroll-manager').GalleryScrollManager;
export type AutoThemeServiceType = import('../services/AutoThemeService').AutoThemeService;
export type VideoServiceType = import('@shared/utils/media').VideoService;
export type GalleryScrollProtectionServiceType =
  import('../services/GalleryScrollProtectionService').GalleryScrollProtectionService;

// Gallery App types
export type GalleryAppType = import('@app/UnifiedGalleryApp').UnifiedGalleryApp;

// Service registry mapping
export interface ServiceTypeMapping {
  'core.bulkDownload': BulkDownloadServiceType;
  gallery: GalleryAppType;
  'gallery.renderer': GalleryRendererType;
  'gallery.download': GalleryDownloadServiceType;
  'media.extraction': MediaExtractionServiceType;
  'media.filename': MediaFilenameServiceType;
  'scroll.pageLock': PageScrollLockManagerType;
  'scroll.gallery': GalleryScrollManagerType;
  'scroll.galleryProtection': GalleryScrollProtectionServiceType;
  'theme.auto': AutoThemeServiceType;
  'video.service': VideoServiceType;
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
