// Image filtering utilities
export {
  imageFilter,
  filterValidImages,
  getDetailedFilterResults,
  isValidTweetImage,
  type FilterOptions,
  type ImageFilterResult,
} from './image-filter';

// Media URL utilities (Phase 351: now via compat layer)
export {
  getHighQualityMediaUrl,
  getMediaUrlsFromTweet,
  isValidMediaUrl,
  isEmojiUrl,
  isVideoThumbnailUrl,
  extractVideoIdFromThumbnail,
  convertThumbnailToVideoUrl,
  classifyMediaUrl,
  shouldIncludeMediaUrl,
  type MediaTypeResult,
} from './media-url-compat';

// Media Click Detection utilities
export {
  detectMediaFromClick,
  findMediaAtCoordinates,
  isProcessableMedia,
  shouldBlockMediaTrigger,
} from './media-click-detector';
