/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL Utility Types
 *
 * Phase 351: Modularization - Type Definitions
 */

// ===== Re-exports from Shared Types =====
export type { MediaInfo } from '../../types/media.types';

// Re-export FilenameOptions from file-naming service
export type { FilenameOptions } from '../../services/file-naming';

// ===== Classification Types =====

/**
 * Media type classification result
 *
 * @property type - Classified media type
 * @property shouldInclude - Whether this URL should be included in extraction
 * @property reason - Optional reason for exclusion
 * @property hostname - URL hostname for debugging
 */
export interface MediaTypeResult {
  type: 'image' | 'video' | 'gif' | 'emoji' | 'video-thumbnail' | 'unknown';
  shouldInclude: boolean;
  reason?: string;
  hostname?: string;
}

// ===== Quality Selection Types =====

/**
 * Video quality variant information
 *
 * Used by quality selector to choose best quality video URL
 */
export interface QualityVariant {
  url: string;
  bitrate: number;
  width?: number;
  height?: number;
}

/**
 * Quality selection options for image/video URLs
 */
export interface QualitySelectionOptions {
  preferredFormat?: 'jpg' | 'png' | 'webp';
  maxSize?: number;
  allowAnimated?: boolean;
}

// ===== Validation Types =====

/**
 * URL validation result with detailed feedback
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

// ===== Internal Extraction Types =====

/**
 * Media extraction context for DOM processing
 *
 * @internal Used internally by extraction layer
 */
export interface MediaExtractionContext {
  tweetId: string;
  rootElement: HTMLElement;
  mediaIndex: number;
}
