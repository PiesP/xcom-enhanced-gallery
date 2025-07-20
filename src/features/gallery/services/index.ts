/**
 * Gallery Services Barrel Export
 *
 * 갤러리 기능 관련 서비스들을 중앙 집중화하여 export합니다.
 * Feature layer 패턴을 따라 shared, core, infrastructure 사용 가능합니다.
 */

// Gallery Services
export { GalleryService, galleryService } from './GalleryService';
export { DownloadService } from './DownloadService';

// Re-export types for convenience
export type { OpenGalleryOptions, NavigationResult, GalleryInfo } from './GalleryService';

export type {
  BulkDownloadOptions,
  DownloadProgress,
  DownloadResult,
} from '@core/services/BulkDownloadService';
