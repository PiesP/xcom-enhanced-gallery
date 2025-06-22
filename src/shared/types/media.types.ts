/**
 * @fileoverview Shared media types
 *
 * Re-exports core media type definitions for use in shared components.
 * This maintains backward compatibility while following the correct
 * architectural dependency direction: shared → core.
 */

// Re-export all media types from core layer
export type {
  DownloadMediaItem,
  GalleryCloseEvent,
  GalleryOpenEvent,
  GalleryOpenEventDetail,
  MediaCollection,
  MediaInfo,
  MediaInfoWithFilename,
  MediaItem,
  MediaQuality,
  MediaType,
  UrlWithFilename,
} from '../../core/types/media.types';
