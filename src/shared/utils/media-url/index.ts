/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL Utility Module - Main Barrel Export
 *
 * Phase 351: Modularization - 6-Layer Architecture
 *
 * @fileoverview 트윗에서 미디어 URL 추출, 분류, 변환, 검증을 담당하는 모듈화된 유틸리티
 * @version 2.0.0 - Phase 351: 6-layer modularization
 *
 * Architecture:
 * - extraction/  : DOM에서 미디어 추출
 * - classification/: URL 타입 분류
 * - transformation/: URL 변환 (원본/고품질)
 * - validation/  : URL 유효성 검증
 * - quality/     : 고품질 URL 선택
 * - factory/     : MediaInfo 객체 생성
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
 * - isValidMediaUrl() - URL 유효성 검증
 *
 * **Classification** (4):
 * - classifyMediaUrl() - URL 타입 분류
 * - isEmojiUrl() - 이모지 URL 판별
 * - isVideoThumbnailUrl() - 비디오 썸네일 판별
 * - shouldIncludeMediaUrl() - 미디어 포함 여부
 *
 * **Transformation** (6):
 * - extractOriginalImageUrl() - 원본 이미지 URL
 * - canExtractOriginalImage() - 원본 추출 가능 여부
 * - extractOriginalVideoUrl() - 원본 비디오 URL
 * - canExtractOriginalVideo() - 원본 비디오 추출 가능 여부
 * - convertThumbnailToVideoUrl() - 썸네일→비디오 변환
 * - extractVideoIdFromThumbnail() - 비디오 ID 추출
 *
 * **Quality** (1):
 * - getHighQualityMediaUrl() - 고품질 URL 선택
 *
 * **Factory** (3):
 * - createMediaInfoFromImage() - 이미지 MediaInfo 생성
 * - createMediaInfoFromVideo() - 비디오 MediaInfo 생성
 * - cleanFilename() - 파일명 정리
 *
 * **Extraction** (1):
 * - getMediaUrlsFromTweet() - DOM에서 미디어 추출
 */
