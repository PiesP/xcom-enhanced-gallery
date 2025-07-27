/**
 * Higher-Order Components Barrel Export
 *
 * HOC 컴포넌트들을 중앙집중식으로 export합니다.
 * Version 2.0 - 통합 HOC 시스템
 */

// 새로운 통합 갤러리 HOC (권장)
export {
  withUnifiedGallery,
  withGalleryContainer,
  withGalleryControl,
  withGalleryItem,
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
