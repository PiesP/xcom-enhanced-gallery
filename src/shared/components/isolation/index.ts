/**
 * @fileoverview 격리된 갤러리 컴포넌트 export (v2.0.0)
 * @description Phase 2 컴포넌트 단순화 - 통합된 시스템
 * @version 2.0.0
 */

// 새로운 통합된 갤러리 컨테이너 컴포넌트
export {
  UnifiedGalleryContainer,
  mountUnifiedGallery,
  unmountUnifiedGallery,
  type UnifiedGalleryContainerProps,
} from './UnifiedGalleryContainer';

// 레거시 컴포넌트 (하위 호환성을 위해 유지, 사용 중단 예정)
export {
  IsolatedGalleryRoot,
  mountIsolatedGallery,
  unmountIsolatedGallery,
  type IsolatedGalleryRootProps,
} from './IsolatedGalleryRoot';

export {
  IsolatedGalleryContainer,
  type IsolatedGalleryContainerProps,
} from './IsolatedGalleryContainer';
