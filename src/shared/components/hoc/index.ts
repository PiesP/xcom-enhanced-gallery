/**
 * Higher-Order Components Barrel Export
 *
 * HOC 컴포넌트들을 중앙집중식으로 export합니다.
 * Version 4.0 - 간소화된 HOC 시스템 (Phase 1)
 */

// 갤러리 HOC (메인) - 복잡한 Unified 접두사 제거
export {
  withGallery,
  GalleryHOC,
  withGalleryContainer,
  withGalleryItem,
  withGalleryOverlay,
  getGalleryType,
  type GalleryType,
  type GalleryOptions,
} from './GalleryHOC';

// 레거시 타입 (하위 호환성)
export type { GalleryComponentProps, GalleryMarkerOptions } from './GalleryMarker';
