/**
 * @fileoverview Gallery Services - Core Layer
 * @version 2.0.0
 */

// Gallery Services
export { GalleryService, galleryService } from './GalleryService';
// GalleryInitializer는 GalleryService에 통합됨
// export { GalleryInitializer } from './GalleryInitializer';

// Re-export types
export type {
  OpenGalleryOptions,
  NavigationResult,
  GalleryInfo,
  GalleryInitConfig,
} from './GalleryService';
