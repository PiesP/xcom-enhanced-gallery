/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview VerticalImageItem Helper Utilities
 * @description Helpers for filename cleaning, video detection, and media processing.
 * @version 1.1.0
 */

import type { MediaInfo } from '@shared/types/media.types';

/**
 * Video file extensions recognized by this application
 * @internal
 */
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'] as const;

const CLEAN_FILENAME_MAX_LENGTH = 40;
const CLEAN_FILENAME_TRUNCATION_MARKER = '...';
const CLEAN_FILENAME_EXTENSION_REGEX = /(?:\.[^./\\]{1,10})$/;
const CLEAN_FILENAME_TWITTER_PREFIX_REGEX = /^twitter_media_\d{8}T\d{6}_/;
const CLEAN_FILENAME_MEDIA_PREFIX_REGEX = /^\/media\//;
const CLEAN_FILENAME_RELATIVE_PREFIX_REGEX = /^\.\//;

/**
 * Clean and normalize filename for display and file saving.
 * Removes Twitter prefixes, /media/ prefix, relative paths, and truncates long filenames (>40 chars).
 * Falls back to "Untitled" when input is missing or empty.
 *
 * @param filename - Original filename (optional)
 * @returns Cleaned filename
 */
export function cleanFilename(filename?: string): string {
  if (!filename) {
    return 'Untitled';
  }

  const truncateMiddlePreservingExtension = (value: string): string => {
    if (value.length <= CLEAN_FILENAME_MAX_LENGTH) {
      return value;
    }

    // Keep a short extension if present (e.g., ".jpg").
    // Limit the extension length to avoid pathological cases.
    const extensionMatch = value.match(CLEAN_FILENAME_EXTENSION_REGEX);
    const extension = extensionMatch?.[1] ?? '';
    const base = extension ? value.slice(0, -extension.length) : value;

    const available =
      CLEAN_FILENAME_MAX_LENGTH - extension.length - CLEAN_FILENAME_TRUNCATION_MARKER.length;
    if (available <= 1) {
      return value.slice(0, CLEAN_FILENAME_MAX_LENGTH);
    }

    const headLen = Math.max(1, Math.floor(available / 2));
    const tailLen = Math.max(1, available - headLen);

    const head = base.slice(0, headLen);
    const tail = base.slice(Math.max(0, base.length - tailLen));

    return `${head}${CLEAN_FILENAME_TRUNCATION_MARKER}${tail}${extension}`;
  };

  let cleaned = filename
    .replace(CLEAN_FILENAME_TWITTER_PREFIX_REGEX, '')
    .replace(CLEAN_FILENAME_MEDIA_PREFIX_REGEX, '')
    .replace(CLEAN_FILENAME_RELATIVE_PREFIX_REGEX, '');

  // If there are path separators, prefer the last path segment (e.g., path/to/file.png -> file.png)
  const lastSegment = cleaned.split(/[\\/]/).pop();
  if (lastSegment) {
    cleaned = lastSegment;
  }

  // Treat a cleaned string consisting only of path separators as empty
  // (e.g., "////"). This ensures we fall back to 'Image' when the
  // resulting filename is effectively empty after stripping.
  if (/^[\\/]+$/.test(cleaned)) {
    cleaned = '';
  }

  cleaned = cleaned.trim();
  if (!cleaned) {
    return 'Image';
  }

  return truncateMiddlePreservingExtension(cleaned);
}

/**
 * Normalize persisted video volume setting.
 *
 * The stored value may be corrupted (e.g. string, NaN, out-of-range).
 * This function ensures the returned value is always a finite number in [0, 1].
 */
export function normalizeVideoVolumeSetting(value: unknown, fallback = 1.0): number {
  const candidate =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;

  if (!Number.isFinite(candidate)) {
    return fallback;
  }

  return Math.min(1.0, Math.max(0.0, candidate));
}

/**
 * Normalize persisted video muted setting.
 *
 * The stored value may be corrupted (e.g. number or string values).
 * This function ensures the returned value is always a boolean.
 */
export function normalizeVideoMutedSetting(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }

  return fallback;
}

/**
 * Detect if media is a video based on file extension and hostname
 *
 * **Detection Strategy**:
 * 1. Check if URL pathname ends with known video extensions (.mp4, .webm, .mov, .avi)
 * 2. Check if filename ends with video extension
 * 3. Validate URL hostname if video.twimg.com (Twitter video host)
 * 4. Fall back to false if URL parsing fails (relative paths, data: URLs)
 *
 * **Security**:
 * - Validates URL structure with URL constructor before accessing hostname
 * - Gracefully handles parsing errors (relative paths, invalid URLs)
 * - Checks extension before hostname to avoid unnecessary URL parsing
 *
 * @param media - MediaInfo object containing url and filename
 * @returns true if media is detected as video, false otherwise
 *
 * @example
 * isVideoMedia({ url: 'https://video.twimg.com/video.mp4', filename: 'clip.mp4' })
 * // Returns true
 *
 * isVideoMedia({ url: 'https://pbs.twimg.com/image.jpg', filename: 'photo.jpg' })
 * // Returns false
 *
 * isVideoMedia({ url: 'relative/path/video.webm', filename: undefined })
 * // Returns true (from extension check)
 */
export function isVideoMedia(media: MediaInfo): boolean {
  const urlLowerCase = media.url.toLowerCase();

  // Prefer parsing so we can reliably inspect `pathname` only.
  // This avoids false positives when query strings/fragments contain ".mp4".
  let parsedUrl: URL | null = null;
  try {
    parsedUrl = new URL(media.url);
  } catch {
    parsedUrl = null;
  }

  const pathToCheck = parsedUrl
    ? parsedUrl.pathname.toLowerCase()
    : (urlLowerCase.split(/[?#]/)[0] ?? '');

  if (VIDEO_EXTENSIONS.some((ext) => pathToCheck.endsWith(ext))) {
    return true;
  }

  // Check filename for video extensions
  if (media.filename) {
    const filenameLowerCase = media.filename.toLowerCase();
    if (VIDEO_EXTENSIONS.some((ext) => filenameLowerCase.endsWith(ext))) {
      return true;
    }
  }

  // Validate URL hostname (security check)
  if (parsedUrl) {
    return parsedUrl.hostname === 'video.twimg.com';
  }

  // URL parsing failed (relative path, data: URL, malformed URL, etc.)
  // Already checked extensions above, so false is correct here.
  return false;
}
