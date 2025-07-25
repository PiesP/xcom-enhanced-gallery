/**
 * @fileoverview Shared Core Layer
 * @description Phase 2: 통합된 핵심 서비스들
 * @version 2.0.0 - Layer Simplification
 */

// ====================================
// 핵심 통합 서비스들
// ====================================

// 미디어 추출 서비스
export { MediaExtractor, mediaExtractor } from './media-extractor';
export { extractUsername, parseUsernameFast } from './media-extractor';
export type { UsernameExtractionResult } from './media-extractor';

// 갤러리 관리 서비스
export { GalleryManager, galleryManager } from './gallery-manager';
export type {
  GalleryInitConfig,
  OpenGalleryOptions,
  NavigationResult,
  GalleryInfo,
} from './gallery-manager';

// 다운로드 관리 서비스
export { DownloadManager, downloadManager } from './download-manager';
export type {
  BulkDownloadOptions,
  DownloadProgress,
  DownloadResult,
  DownloadInfo,
  SingleDownloadOptions,
} from './download-manager';

// 통합 상태 관리
export * from './app-state';
export type { AppStateSnapshot } from './app-state';
