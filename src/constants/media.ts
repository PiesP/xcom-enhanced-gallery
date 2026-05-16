/** @fileoverview Media-related constants for X.com media handling. */

const MEDIA_HOSTS = {
  MEDIA_CDN: ['pbs.twimg.com', 'video.twimg.com'],
} as const;

export const MEDIA = {
  DOMAINS: [...MEDIA_HOSTS.MEDIA_CDN, 'abs.twimg.com'],
  HOSTS: MEDIA_HOSTS,

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

  QUALITY: {
    ORIGINAL: 'orig',
    LARGE: 'large',
    MEDIUM: 'medium',
    SMALL: 'small',
  },
} as const;

export type MediaType = (typeof MEDIA.TYPES)[keyof typeof MEDIA.TYPES];
export type MediaQuality = (typeof MEDIA.QUALITY)[keyof typeof MEDIA.QUALITY];
export type MediaExtension = (typeof MEDIA.EXTENSIONS)[keyof typeof MEDIA.EXTENSIONS];
