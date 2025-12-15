/**
 * @fileoverview Media-related constants
 */

export const MEDIA = {
  DOMAINS: ['pbs.twimg.com', 'video.twimg.com', 'abs.twimg.com'],
  /**
   * Host allow-lists used by URL validators.
   * Keep this as the single source of truth to avoid policy drift.
   */
  HOSTS: {
    /**
     * Media CDN hosts that can serve images/videos.
     * Note: abs.twimg.com is intentionally excluded (static assets, not media URLs).
     */
    MEDIA_CDN: ['pbs.twimg.com', 'video.twimg.com'],
  },
  TYPES: {
    IMAGE: 'image',
    VIDEO: 'video',
    GIF: 'gif',
  },
  EXTENSIONS: {
    JPEG: 'jpg',
    PNG: 'png',
    WEBP: 'webp',
    GIF: 'gif',
    MP4: 'mp4',
    ZIP: 'zip',
  },
  /** Media quality options */
  QUALITY: {
    ORIGINAL: 'orig',
    LARGE: 'large',
    MEDIUM: 'medium',
    SMALL: 'small',
  },
} as const;
