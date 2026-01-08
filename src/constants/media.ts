/**
 * @fileoverview Media-related constants for Twitter/X.com media handling.
 * @module constants/media
 */

/**
 * Media-related constants: domains, types, extensions, quality variants.
 *
 * Uses `as const` to preserve literal types for exhaustive pattern matching.
 *
 * @example
 * ```typescript
 * if (MEDIA.HOSTS.MEDIA_CDN.includes(hostname)) {
 *   // Process media URL
 * }
 * ```
 */
export const MEDIA = {
  /**
   * All Twitter CDN domains
   *
   * @remarks
   * Includes both media CDN hosts and static asset hosts.
   * Use HOSTS.MEDIA_CDN for media-specific validation.
   *
   * @see {@link MEDIA.HOSTS.MEDIA_CDN} for media-specific hosts
   */
  DOMAINS: ['pbs.twimg.com', 'video.twimg.com', 'abs.twimg.com'],

  /**
   * Host allow-lists used by URL validators
   *
   * @remarks
   * Keep this as the single source of truth to avoid policy drift.
   * Each category represents a specific use case for domain validation.
   */
  HOSTS: {
    /** Media CDN hosts (excludes abs.twimg.com which is static assets) */
    MEDIA_CDN: ['pbs.twimg.com', 'video.twimg.com'],
  },

  /**
   * Media type identifiers
   *
   * @remarks
   * Used throughout the application for type discrimination and UI rendering.
   * These values align with MediaInfo type definitions.
   *
   * @see {@link MediaInfo} type definition
   */
  TYPES: {
    /** Static image content */
    IMAGE: 'image',
    /** Video content */
    VIDEO: 'video',
    /** Animated GIF content */
    GIF: 'gif',
  },

  /**
   * Supported file extensions
   *
   * @remarks
   * Extension values are lowercase without leading dot.
   * Used for file type detection and download filename generation.
   */
  EXTENSIONS: {
    /** JPEG image format */
    JPEG: 'jpg',
    /** PNG image format */
    PNG: 'png',
    /** WebP image format */
    WEBP: 'webp',
    /** GIF image/animation format */
    GIF: 'gif',
    /** MP4 video format */
    MP4: 'mp4',
    /** ZIP archive format */
    ZIP: 'zip',
  },

  /**
   * Media quality/size variants
   *
   * @remarks
   * These values are appended to Twitter media URLs as `?name=<quality>` query parameters.
   * Used for requesting specific media sizes from Twitter CDN.
   *
   * @example
   * ```typescript
   * // Request original quality
   * const url = `${baseUrl}?name=${MEDIA.QUALITY.ORIGINAL}`;
   *
   * // Request large thumbnail
   * const thumb = `${baseUrl}?name=${MEDIA.QUALITY.LARGE}`;
   * ```
   */
  QUALITY: {
    /** Original/highest quality (uncompressed) */
    ORIGINAL: 'orig',
    /** Large size variant */
    LARGE: 'large',
    /** Medium size variant */
    MEDIUM: 'medium',
    /** Small size variant (thumbnail) */
    SMALL: 'small',
  },
} as const;

/**
 * Type helper: Extract media type union from MEDIA.TYPES
 *
 * @example
 * ```typescript
 * type MediaType = typeof MEDIA.TYPES[keyof typeof MEDIA.TYPES];
 * // 'image' | 'video' | 'gif'
 * ```
 */
export type MediaType = (typeof MEDIA.TYPES)[keyof typeof MEDIA.TYPES];

/**
 * Type helper: Extract quality union from MEDIA.QUALITY
 *
 * @example
 * ```typescript
 * type MediaQuality = typeof MEDIA.QUALITY[keyof typeof MEDIA.QUALITY];
 * // 'orig' | 'large' | 'medium' | 'small'
 * ```
 */
export type MediaQuality = (typeof MEDIA.QUALITY)[keyof typeof MEDIA.QUALITY];

/**
 * Type helper: Extract extension union from MEDIA.EXTENSIONS
 *
 * @example
 * ```typescript
 * type MediaExtension = typeof MEDIA.EXTENSIONS[keyof typeof MEDIA.EXTENSIONS];
 * // 'jpg' | 'png' | 'webp' | 'gif' | 'mp4' | 'zip'
 * ```
 */
export type MediaExtension = (typeof MEDIA.EXTENSIONS)[keyof typeof MEDIA.EXTENSIONS];
