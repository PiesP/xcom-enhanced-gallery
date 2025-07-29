/**
 * @fileoverview 격리된 갤러리 컴포넌트 export (v2.0.0)
 * @description Phase 2 컴포넌트 단순화 - 통합된 시스템
 * @version 2.0.0
 */

// 새로운 명명
export { GalleryContainer, type GalleryContainerProps } from './GalleryContainer';

// 하위 호환성 (구 명명)
export {
  UnifiedGalleryContainer,
  mountUnifiedGallery,
  unmountUnifiedGallery,
  type UnifiedGalleryContainerProps,
} from './UnifiedGalleryContainer';
