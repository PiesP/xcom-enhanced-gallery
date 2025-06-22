// Image filtering utilities
export {
  enhancedImageFilter,
  filterValidImages,
  getDetailedFilterResults,
  isValidEnhancedTweetImage,
  type EnhancedFilterOptions,
  type ImageFilterResult,
} from './enhanced-image-filter';

// Video control utilities - DEPRECATED, use VideoService instead
// export { VideoControlUtil } from './video-control.util';

// Video state management utilities - DEPRECATED, use VideoService instead
// export { VideoStateManager } from './video-state-manager';

// Filename generation utilities - moved to infrastructure
// TODO: Remove after updating all imports to use @infrastructure/media
export {
  MediaFilenameService,
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
  type FilenameOptions,
  type ZipFilenameOptions,
} from '@infrastructure/media';

// Media URL utilities
export { getHighQualityMediaUrl, getMediaUrlsFromTweet, isValidMediaUrl } from './media-url.util';

// Media Click Detection utilities
export { MediaClickDetector } from './MediaClickDetector';

// Video Management utilities (새로운 통합 서비스)
export { VideoService, videoService } from './VideoService';

// 기존 호환성을 위한 별칭 export
export { VideoService as UnifiedVideoManager } from './VideoService';
export { VideoService as VideoStateManager } from './VideoService';
export { VideoService as VideoControlUtil } from './VideoService';
