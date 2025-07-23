/**
 * Gallery Services Barrel Export
 *
 * 갤러리 기능 관련 서비스들을 중앙 집중화하여 export합니다.
 * Feature layer 패턴을 따라 shared, core, infrastructure 사용 가능합니다.
 */

// Gallery Services - Core로 통합됨
export { GalleryService, galleryService } from '@core/services/gallery/GalleryService';

// Re-export types for convenience
export type {
  OpenGalleryOptions,
  NavigationResult,
  GalleryInfo,
} from '@core/services/gallery/GalleryService';

// Download services - Core BulkDownloadService 직접 사용
export {
  BulkDownloadService,
  type BulkDownloadOptions,
  type DownloadProgress,
  type DownloadResult,
} from '@core/services/BulkDownloadService';
