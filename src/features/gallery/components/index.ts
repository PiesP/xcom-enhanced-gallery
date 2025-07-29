/**
 * @fileoverview Gallery Components Index
 * @version 4.0.0 - 통합 갤러리 뷰 컴포넌트 추가
 * @description 통합된 갤러리 컴포넌트들의 export
 */

// 통합 갤러리 뷰 컴포넌트
export { GalleryView } from './GalleryView';
export type { GalleryViewProps, GalleryLayout } from './GalleryView';

// 레거시 갤러리 뷰 컴포넌트들 (호환성 유지)
export { VerticalGalleryView } from './vertical-gallery-view/VerticalGalleryView';
export { VerticalImageItem } from './vertical-gallery-view/VerticalImageItem';

// 갤러리 훅들
export * from './vertical-gallery-view/hooks';

// 타입들
export type { VerticalGalleryViewProps } from './vertical-gallery-view/VerticalGalleryView';
