/**
 * Higher-Order Components Barrel Export
 *
 * HOC 컴포넌트들을 중앙집중식으로 export합니다.
 */

// Gallery Marker HOC
export {
  withGalleryContainer,
  withGalleryControl,
  withGalleryItem,
  withGalleryMarker,
  withGalleryViewer,
} from './GalleryMarker';
export type { GalleryComponentProps, GalleryMarkerOptions } from './GalleryMarker';
