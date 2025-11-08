// Media URL utilities (Phase 351: modularized exports)
export {
  getHighQualityMediaUrl,
  isValidMediaUrl,
  isEmojiUrl,
  isVideoThumbnailUrl,
  extractVideoIdFromThumbnail,
  convertThumbnailToVideoUrl,
  classifyMediaUrl,
  shouldIncludeMediaUrl,
  type FilenameOptions,
  type MediaTypeResult,
} from '../media-url';

// DOM extraction utilities retained until migration completes
export { getMediaUrlsFromTweet } from './media-url.util';

// Media Click Detection utilities
export {
  detectMediaFromClick,
  findMediaAtCoordinates,
  isProcessableMedia,
  shouldBlockMediaTrigger,
} from './media-click-detector';
