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

// Import service class types for type safety (Infrastructure only)
export type BulkDownloadServiceType = import('../services/BulkDownloadService').BulkDownloadService;
export type FilenameServiceType = import('../../infrastructure/media').FilenameService;
export type ThemeServiceType = import('../services/ThemeService').ThemeService;
export type VideoControlServiceType =
  import('../services/media/VideoControlService').VideoControlService;
export type ToastControllerType = import('../services/ToastController').ToastController;

// Generic service interfaces for features and shared services
export interface GalleryRendererType extends BaseService {
  render(mediaItems: readonly unknown[], renderOptions?: unknown): Promise<void>;
  close?(): void;
  isRendering?(): boolean;
  setOnCloseCallback?(callback: () => void): void;
}

export interface DownloadManagerType extends BaseService {
  getInstance?(): DownloadManagerType;
  downloadAll(items: unknown[]): Promise<void>;
}

export interface MediaExtractionServiceType extends BaseService {
  extractMediaFromElement?(element: Element): Promise<unknown>;
  extractMedia?(element: Element, options?: unknown): Promise<unknown>;
  getInstance?(): MediaExtractionServiceType;
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
