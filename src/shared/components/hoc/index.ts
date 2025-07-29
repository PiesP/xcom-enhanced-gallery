/**
 * Higher-Order Components Barrel Export
 *
 * HOC 컴포넌트들을 중앙집중식으로 export합니다.
 * Version 3.0 - 단순화된 HOC 시스템
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
} from './GalleryHOC';

// 레거시 통합 갤러리 HOC (호환성 유지)
export {
  withUnifiedGallery,
  withGalleryControl,
  isUnifiedGalleryElement,
  getUnifiedGalleryType,
  isEventFromUnifiedGallery,
  validateHOCIntegration,
  createHOCStandardProps,
} from './UnifiedGalleryHOC';

export type {
  UnifiedGalleryType,
  UnifiedGalleryOptions,
  UnifiedGalleryComponentProps,
} from './UnifiedGalleryHOC';

// 레거시 HOC (하위 호환성 - 사용 금지)
export { withGalleryMarker } from './UnifiedGalleryHOC';

// 레거시 타입 (하위 호환성 - 사용 금지)
export type { GalleryComponentProps, GalleryMarkerOptions } from './GalleryMarker';
