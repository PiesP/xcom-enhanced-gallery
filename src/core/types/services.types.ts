/**
 * @fileoverview Service Types (Legacy)
 * @deprecated Use @core/types/core-types instead - this is kept for backward compatibility during migration
 *
 * Phase 1 Step 2: Core 타입 통합
 * Service 관련 타입들이 core-types.ts로 통합되었습니다.
 */

// Re-export from integrated core types
export * from './core-types';

// Legacy specific exports that are not in core-types
export interface ServiceTypeMapping {
  'core.bulkDownload': import('./core-types').BulkDownloadServiceType;
  gallery: unknown; // GalleryAppType - features layer 타입이므로 unknown 사용
  'gallery.renderer': unknown; // GalleryRendererType - features layer 타입이므로 unknown 사용
  'gallery.download': unknown; // DownloadManagerType - features layer 타입이므로 unknown 사용
  'media.extraction': unknown; // MediaExtractionServiceType - features layer 타입이므로 unknown 사용
  'media.filename': import('./core-types').FilenameServiceType;
  'theme.auto': import('./core-types').ThemeServiceType;
  'toast.controller': import('./core-types').ToastControllerType;
  'video.state': import('./core-types').VideoControlServiceType;
  'video.control': import('./core-types').VideoControlServiceType;
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
