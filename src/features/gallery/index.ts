/**
 * @fileoverview Gallery Feature Exports
 * @version 2.0.0 - Phase 2B Clean Architecture Optimization
 * @description 갤러리 Feature 통합 및 최적화 - 단일 렌더러 통합
 */

// 통합된 갤러리 렌더러 (기본)
export { GalleryRenderer, galleryRenderer } from './GalleryRenderer';

// 갤러리 앱 (App 레이어에서 이동)
export { GalleryApp } from './GalleryApp';
export type { GalleryConfig } from './GalleryApp';

// 갤러리 조정자들 (Core에서 직접 import)
export { CoordinatorManager, Coordinator } from '@core/managers/coordinators';
export type { ManagedExtractionResult } from '@core/managers/coordinators/CoordinatorManager';

// 격리된 갤러리 렌더러 (고급 사용)
export {
  IsolatedGalleryRenderer,
  renderIsolatedGallery,
  findActiveIsolatedGallery,
  cleanupAllIsolatedGalleries,
  type IsolatedGalleryRendererOptions,
} from './renderers/IsolatedGalleryRenderer';

// 핵심 갤러리 컴포넌트들
export { VerticalGalleryView } from './components/vertical-gallery-view';

// 갤러리 서비스들 (Core로 통합됨)
export { GalleryService, galleryService } from '@core/services/gallery/GalleryService';
export { BulkDownloadService } from '@core/services/BulkDownloadService';
export type {
  OpenGalleryOptions,
  NavigationResult,
  GalleryInfo,
} from '@core/services/gallery/GalleryService';

// 갤러리 이벤트 (필요시)
export * from './events';

// 갤러리 타입들
export * from './types';
