/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL Utility Module - Main Barrel Export
 *
 * Phase 351: Modularization - 6-Layer Architecture
 *
 * @fileoverview Modularized utility for extracting, classifying, transforming, and validating media URLs from tweets
 * @version 2.0.0 - Phase 351: 6-layer modularization
 *
 * Architecture:
 * - extraction/  : Extract media from DOM
 * - classification/: Classify URL types
 * - transformation/: Transform URLs (original/high-quality)
 * - validation/  : Validate URL validity
 * - quality/     : Select high-quality URL
 * - factory/     : Create MediaInfo objects
 */

// ===== Type Exports =====
export type {
  MediaInfo,
  FilenameOptions,
  MediaTypeResult,
  QualityVariant,
  QualitySelectionOptions,
  ValidationResult,
  MediaExtractionContext,
} from './types';

// ===== Layer Exports =====

// Validation Layer (Phase 351.3) ✅
export { isValidMediaUrl } from './validation';

// Classification Layer (Phase 351.4) ✅
export {
  classifyMediaUrl,
  isEmojiUrl,
  isVideoThumbnailUrl,
  shouldIncludeMediaUrl,
} from './classification';

// Transformation Layer (Phase 351.5) ✅
export {
  extractOriginalImageUrl,
  canExtractOriginalImage,
  extractOriginalVideoUrl,
  canExtractOriginalVideo,
  convertThumbnailToVideoUrl,
  extractVideoIdFromThumbnail,
} from './transformation';

// Quality Layer (Phase 351.6) ✅
export { getHighQualityMediaUrl } from './quality';

// Factory Layer (Phase 351.7) ✅
export { cleanFilename } from './factory';

// Note: Extraction layer will be added when needed
// Currently getMediaUrlsFromTweet stays in legacy location for compatibility

// Classification Layer (Phase 351.4)
// export {
//   classifyMediaUrl,
//   isEmojiUrl,
//   isVideoThumbnailUrl,
//   shouldIncludeMediaUrl,
// } from './classification';

// Transformation Layer (Phase 351.5)
// export {
//   extractOriginalImageUrl,
//   canExtractOriginalImage,
//   extractOriginalVideoUrl,
//   canExtractOriginalVideo,
//   convertThumbnailToVideoUrl,
//   extractVideoIdFromThumbnail,
// } from './transformation';

// Quality Layer (Phase 351.6)
// export { getHighQualityMediaUrl } from './quality';

// Factory Layer (Phase 351.7)
// export {
//   createMediaInfoFromImage,
//   createMediaInfoFromVideo,
//   cleanFilename,
// } from './factory';

// Extraction Layer (Phase 351.8)
// export { getMediaUrlsFromTweet } from './extraction';

/**
 * Public API Summary (When Complete)
 *
 * **Validation** (1):
 * - isValidMediaUrl() - URL validity validation
 *
 * **Classification** (4):
 * - classifyMediaUrl() - Classify URL types
 * - isEmojiUrl() - Determine if emoji URL
 * - isVideoThumbnailUrl() - Determine if video thumbnail
 * - shouldIncludeMediaUrl() - Check whether media should be included
 *
 * **Transformation** (6):
 * - extractOriginalImageUrl() - Extract original image URL
 * - canExtractOriginalImage() - Check if original extraction possible
 * - extractOriginalVideoUrl() - Extract original video URL
 * - canExtractOriginalVideo() - Check if original video extraction possible
 * - convertThumbnailToVideoUrl() - Convert thumbnail to video
 * - extractVideoIdFromThumbnail() - Extract video ID
 *
 * **Quality** (1):
 * - getHighQualityMediaUrl() - Select high-quality URL
 *
 * **Factory** (3):
 * - createMediaInfoFromImage() - Create image MediaInfo
 * - createMediaInfoFromVideo() - Create video MediaInfo
 * - cleanFilename() - Clean filename
 *
 * **Extraction** (1):
 * - getMediaUrlsFromTweet() - Extract media from DOM
 */
