// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

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
} as const;

/** Standard gallery display height in pixels. */
export const STANDARD_GALLERY_HEIGHT = 720;

/** Default fallback dimensions when media size cannot be determined. */
export const DEFAULT_MEDIA_DIMENSIONS = { width: 540, height: STANDARD_GALLERY_HEIGHT } as const;

/** CSS rem base for px-to-rem conversion. */
export const CSS_REM_BASE = 16;

/** Epsilon for volume comparison with floating-point tolerance. */
export const VOLUME_EPSILON = 0.001;

/** Threshold ratio for element visibility in focus selection. */
export const FOCUS_VISIBILITY_RATIO_THRESHOLD = 0.1;
