/**
 * @fileoverview 격리된 갤러리 컴포넌트 export (v3.0.0)
 * @description Phase 3 서비스 아키텍처 개선 - 명명 단순화
 * @version 3.0.0
 */

// 새로운 명명 (Phase 3)
export { GalleryContainer, type GalleryContainerProps } from './GalleryContainer';

// 갤러리 마운트/언마운트 헬퍼 함수들 (새로운 명명)
export { mountUnifiedGallery as mountGallery } from './UnifiedGalleryContainer';
export { unmountUnifiedGallery as unmountGallery } from './UnifiedGalleryContainer';

// 하위 호환성 (구 명명)
export {
  UnifiedGalleryContainer,
  mountUnifiedGallery,
  unmountUnifiedGallery,
  type UnifiedGalleryContainerProps,
} from './UnifiedGalleryContainer';
