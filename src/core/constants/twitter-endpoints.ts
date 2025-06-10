/**
 * URL constants and patterns for X.com Enhanced Gallery
 *
 * This module provides backward compatibility exports.
 * New code should import from ENDPOINTS_CONSTANTS and MEDIA_CONSTANTS instead.
 *
 * @fileoverview Legacy compatibility layer for URL constants
 * @deprecated Use ENDPOINTS_CONSTANTS and MEDIA_CONSTANTS instead
 * @version 1.0.0
 * @since 1.0.0
 */

// Re-export from new organized constants
export {
  API_ENDPOINTS,
  MEDIA_DOMAINS,
  MEDIA_URL_UTILS,
  UNIFIED_MEDIA_PATTERNS,
  URL_UTILS,
  X_DOMAINS,
  type MediaDomain,
  type XDomain,
} from './ENDPOINTS_CONSTANTS';

export {
  FILE_EXTENSIONS,
  MEDIA_CONFIG,
  MEDIA_QUALITY,
  MEDIA_TYPES,
  TWITTER_API_CONFIG,
  URL_CLEANUP_DELAY,
  type FileExtension,
  type MediaQuality,
  type MediaType,
} from './MEDIA_CONSTANTS';

/**
 * WebP detection test image (1x1 pixel)
 */
export const WEBP_TEST_IMAGE =
  'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';

/**
 * Image size suffixes used in X.com URLs
 */
export const IMAGE_SIZES = {
  /** Thumbnail size */
  THUMB: 'thumb',
  /** Small size */
  SMALL: 'small',
  /** Medium size */
  MEDIUM: 'medium',
  /** Large size */
  LARGE: 'large',
  /** Original size */
  ORIG: 'orig',
} as const;

/**
 * Video quality identifiers
 */
export const VIDEO_QUALITIES = {
  /** Low quality */
  LOW: 'low',
  /** Medium quality */
  MEDIUM: 'medium',
  /** High quality */
  HIGH: 'high',
} as const;

/**
 * Supported image formats for X.com media
 */
export const IMAGE_FORMATS = {
  /** JPEG format */
  JPG: 'jpg',
  /** JPEG format (alternative) */
  JPEG: 'jpeg',
  /** PNG format */
  PNG: 'png',
  /** WebP format */
  WEBP: 'webp',
  /** GIF format */
  GIF: 'gif',
} as const;

/**
 * URL transformation patterns
 */
export const URL_TRANSFORMS = {
  /** Remove size parameter from image URL */
  REMOVE_SIZE: /[?&]name=\w+/g,

  /** Extract media ID from image URL */
  MEDIA_ID: /\/media\/([\w-]+)\?/,

  /** Extract video ID from video URL */
  VIDEO_ID: /\/ext_tw_video\/(\d+)\//,
} as const;

/**
 * Default values for URL operations
 */
export const DEFAULTS = {
  /** Default image format */
  IMAGE_FORMAT: 'jpg',

  /** Default image size */
  IMAGE_SIZE: IMAGE_SIZES.ORIG,

  /** Default video quality */
  VIDEO_QUALITY: VIDEO_QUALITIES.HIGH,

  /** Default timeout for URL operations (ms) */
  TIMEOUT: 10000,
} as const;

/**
 * Type definitions for URL-related operations
 */
export type ImageSize = (typeof IMAGE_SIZES)[keyof typeof IMAGE_SIZES];
export type VideoQuality = (typeof VIDEO_QUALITIES)[keyof typeof VIDEO_QUALITIES];
