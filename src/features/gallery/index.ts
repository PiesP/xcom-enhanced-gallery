/**
 * @fileoverview Gallery Feature Exports
 * @version 2.0.0 - Phase 2 컴포넌트 단순화
 * @description 갤러리 Feature 통합 및 최적화 - 단일 렌더러 통합
 */

// 통합된 갤러리 렌더러 (기본)
export { GalleryRenderer, galleryRenderer } from './GalleryRenderer';

// 갤러리 앱 (App 레이어에서 이동)
export { GalleryApp } from './GalleryApp';
export type { GalleryConfig } from './GalleryApp';

// 핵심 갤러리 컴포넌트들
export { VerticalGalleryView } from './components/vertical-gallery-view';

// 갤러리 서비스들 (Core로 통합됨) - GalleryService 제거됨
// export { GalleryService, galleryService } from '@shared/services/gallery/GalleryService';
// Vitest(vite-node) Windows alias 해석 이슈 회피를 위해 내부 임포트는 상대 경로 사용
export { BulkDownloadService } from '../../shared/services/BulkDownloadService';
// export type {
//   OpenGalleryOptions,
//   NavigationResult,
//   GalleryInfo,
// } from '@shared/services/gallery/GalleryService';

// 갤러리 타입들
export * from './types';
