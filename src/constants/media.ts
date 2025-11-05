/**
 * @fileoverview 미디어 관련 상수
 */

export const MEDIA = {
  DOMAINS: ['pbs.twimg.com', 'video.twimg.com', 'abs.twimg.com'],
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
  /** 미디어 품질 */
  QUALITY: {
    ORIGINAL: 'orig',
    LARGE: 'large',
    MEDIUM: 'medium',
    SMALL: 'small',
  },
} as const;
