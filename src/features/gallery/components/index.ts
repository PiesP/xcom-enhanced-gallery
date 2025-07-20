/**
 * @fileoverview Gallery Components Index
 * @version 2.0.0 - Phase 2B Optimization
 * @description 갤러리 컴포넌트들의 통합 export
 */

// 핵심 갤러리 뷰 컴포넌트들
export { VerticalGalleryView } from './vertical-gallery-view/VerticalGalleryView';
export { VerticalImageItem } from './vertical-gallery-view/VerticalImageItem';
export { GalleryView } from './GalleryView';

// 갤러리 하위 컴포넌트들 (세부 기능)
export * from './vertical-gallery-view/components';

// 갤러리 훅들
export * from './vertical-gallery-view/hooks';

// 타입들
export type { VerticalGalleryViewProps } from './vertical-gallery-view/VerticalGalleryView';
export type { GalleryViewProps } from './GalleryView';
