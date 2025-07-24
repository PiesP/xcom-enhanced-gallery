/**
 * @fileoverview Gallery Feature Exports (단순화됨)
 * @version 3.0.0 - 단순화된 아키텍처
 * @description 갤러리 Feature 단순화 - 불필요한 복잡성 제거
 */

// 통합된 갤러리 렌더러 (기본)
export { GalleryRenderer, galleryRenderer } from './GalleryRenderer';

// 갤러리 앱 (단순화됨)
export { GalleryApp } from './GalleryApp';
export type { GalleryConfig } from './GalleryApp';

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
