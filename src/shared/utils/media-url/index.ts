/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL utility barrel exposing the public helpers.
 */

// ===== Type Exports =====
export type { MediaTypeResult } from './types';

// ===== Layer Exports =====

// Validation Layer (Phase 351.3) ✅
export { isValidMediaUrl, isTwitterMediaUrl } from './validation/url-validator';

// Classification Layer (Phase 351.4) ✅
export {
  classifyMediaUrl,
  isEmojiUrl,
  isVideoThumbnailUrl,
  shouldIncludeMediaUrl,
} from './classification/url-classifier';

// Transformation Layer (Phase 351.5) ✅
export {
  extractOriginalImageUrl,
  canExtractOriginalImage,
  extractMediaId,
  generateOriginalUrl,
} from './transformation/image-transformer';
export {
  extractOriginalVideoUrl,
  canExtractOriginalVideo,
  extractVideoIdFromThumbnail,
  convertThumbnailToVideoUrl,
} from './transformation/video-transformer';

// Quality Layer (Phase 351.6) ✅
export { getHighQualityMediaUrl } from './quality/quality-selector';

// Factory Layer (Phase 351.7) ✅
export { cleanFilename } from './factory/filename-utils';
