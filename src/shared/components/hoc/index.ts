/**
 * Higher-Order Components Barrel Export
 *
 * HOC 컴포넌트들을 중앙집중식으로 export합니다.
 * Version 4.0 - 간소화된 HOC 시스템 (Phase 3)
 */

// 갤러리 HOC (메인)
export {
  withGallery,
  GalleryHOC,
  withGalleryContainer,
  withGalleryItem,
  withGalleryOverlay,
  getGalleryType,
  type GalleryType,
  type GalleryOptions,
  type GalleryComponentProps,
} from './GalleryHOC';
