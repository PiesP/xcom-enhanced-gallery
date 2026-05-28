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
