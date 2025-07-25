/**
 * @fileoverview Shared Core Layer - DEPRECATED
 * @description Phase 2: 통합된 핵심 서비스들이 services 레이어로 이전됨
 * @version 2.0.0 - DEPRECATED - Use services layer instead
 * @deprecated Use services layer instead
 */

// ====================================
// DEPRECATED: 모든 기능이 services 레이어로 이전됨
// ====================================

// 통합된 미디어 서비스로 교체됨
export {
  MediaService as MediaExtractor,
  mediaService as mediaExtractor,
} from '@shared/services/MediaService';
export { extractUsername, parseUsernameFast } from '@shared/services/MediaService';
export type { UsernameExtractionResult } from '@shared/services/MediaService';

// 갤러리 서비스로 교체됨
export {
  GalleryService as GalleryManager,
  galleryService as galleryManager,
} from '@shared/services/gallery/GalleryService';
export type {
  GalleryInitConfig,
  OpenGalleryOptions,
  NavigationResult,
  GalleryInfo,
} from '@shared/services/gallery/GalleryService';

// 다운로드 서비스로 교체됨
export { DownloadManager, downloadManager } from './download-manager-redirect';
export type {
  BulkDownloadOptions,
  DownloadProgress,
  DownloadResult,
  DownloadInfo,
  SingleDownloadOptions,
} from '@shared/services/BulkDownloadService';

// 통합 상태 관리
export * from './app-state';
export type { AppStateSnapshot } from './app-state';
