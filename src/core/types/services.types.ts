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
export type EnhancedMediaExtractionServiceType =
  import('@features/media/services/EnhancedMediaExtractionService').EnhancedMediaExtractionService;
export type MediaFilenameServiceType =
  import('@shared/utils/media/FilenameService').MediaFilenameService;

// Manager types
export type PageScrollLockManagerType =
  import('@shared/utils/core/dom/scroll-manager').PageScrollLockManager;
export type GalleryScrollManagerType =
  import('@shared/utils/core/dom/gallery-scroll-manager').GalleryScrollManager;
export type AutoThemeControllerType = import('@shared/utils/core/auto-theme').AutoThemeController;
export type VideoStateManagerType =
  import('@shared/utils/media/video-state-manager').VideoStateManager;
export type VideoControlUtilType =
  import('@shared/utils/media/video-control.util').VideoControlUtil;

// Service registry mapping
export interface ServiceTypeMapping {
  'core.bulkDownload': BulkDownloadServiceType;
  'gallery.renderer': GalleryRendererType;
  'gallery.download': GalleryDownloadServiceType;
  'media.extraction': EnhancedMediaExtractionServiceType;
  'media.filename': MediaFilenameServiceType;
  'scroll.pageLock': PageScrollLockManagerType;
  'scroll.gallery': GalleryScrollManagerType;
  'theme.auto': AutoThemeControllerType;
  'video.state': VideoStateManagerType;
  'video.control': VideoControlUtilType;
}

// Service manager errors
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly serviceKey?: string,
    public readonly cause?: Error
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
