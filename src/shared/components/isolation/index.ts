/**
 * @fileoverview 격리된 갤러리 컴포넌트 export (v2.0.0)
 * @description 새로운 격리된 시스템의 주요 컴포넌트들을 export
 * @version 2.0.0
 */

// 새로운 격리된 갤러리 루트 컴포넌트
export {
  IsolatedGalleryRoot,
  mountIsolatedGallery,
  unmountIsolatedGallery,
  type IsolatedGalleryRootProps,
} from './IsolatedGalleryRoot';

// 레거시 컴포넌트 (사용 중단 예정)
export {
  IsolatedGalleryContainer,
  createIsolatedGalleryContainer,
  type IsolatedGalleryContainerProps,
} from './IsolatedGalleryContainer';
