/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Pure functional filename utilities
 * @description Stateless filename generation and validation functions
 * @version 4.0.0 - Functional refactor from FilenameService class
 */

import type { MediaInfo } from '@shared/types/media.types';
import { safeParseInt } from '@shared/utils/types/safety';
import { extractUsernameFromUrl } from '@shared/utils/url';

// ============================================================================
// Types
// ============================================================================

export interface FilenameOptions {
  index?: string | number;
  extension?: string;
  fallbackPrefix?: string;
  fallbackUsername?: string;
}

export interface ZipFilenameOptions {
  fallbackPrefix?: string;
}

interface MediaMetadata {
  username: string | null;
  tweetId: string | null;
}

// ============================================================================
// Internal Pure Functions
// ============================================================================

/**
 * Sanitize filename by replacing reserved characters
 * @param name - Raw filename
 * @returns Sanitized filename safe for filesystem
 */
function sanitize(name: string): string {
  const sanitized = name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/^[\s.]+|[\s.]+$/g, '')
    .slice(0, 255);
  return sanitized || 'media';
}

/**
 * Extract file extension from URL
 * @param url - Media URL
 * @returns Lowercase extension or 'jpg' as default
 */
function getExtension(url: string): string {
  try {
    const path = url.split('?')[0];
    if (!path) return 'jpg';
    const ext = path.split('.').pop();
    if (ext && /^(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(ext)) {
      return ext.toLowerCase();
    }
  } catch {
    // ignore
  }
  return 'jpg';
}

/**
 * Extract index from media ID
 * @param mediaId - Media identifier (e.g., 'twitter_media_0', 'prefix_1')
 * @returns Index string or null
 */
function getIndexFromMediaId(mediaId?: string): string | null {
  if (!mediaId) return null;
  const match = mediaId.match(/_media_(\d+)$/) || mediaId.match(/_(\d+)$/);
  if (match) {
    const idx = safeParseInt(match[1], 10);
    return mediaId.includes('_media_') ? (idx + 1).toString() : (match[1] ?? null);
  }
  return null;
}

/**
 * Normalize index to string
 * @param index - Optional index value
 * @returns Normalized index string (minimum '1')
 */
function normalizeIndex(index?: string | number): string {
  if (index === undefined || index === null) return '1';
  const num = typeof index === 'string' ? safeParseInt(index, 10) : index;
  return Number.isNaN(num) || num < 1 ? '1' : num.toString();
}

/**
 * Resolve username and tweetId from media metadata
 * @param media - Media info object
 * @param fallbackUsername - Optional fallback username
 * @returns Resolved metadata
 */
function resolveMetadata(media: MediaInfo, fallbackUsername?: string | null): MediaMetadata {
  let username: string | null = null;
  let tweetId: string | null = null;

  if (media.sourceLocation === 'quoted' && media.quotedUsername && media.quotedTweetId) {
    username = media.quotedUsername;
    tweetId = media.quotedTweetId;
  } else {
    tweetId = media.tweetId ?? null;
    if (media.tweetUsername && media.tweetUsername !== 'unknown') {
      username = media.tweetUsername;
    } else {
      const url = ('originalUrl' in media ? media.originalUrl : null) || media.url;
      if (typeof url === 'string') {
        // Use strict host validation for security
        username = extractUsernameFromUrl(url, { strictHost: true });
      }
    }
  }

  if (!username && fallbackUsername) {
    username = fallbackUsername;
  }

  return { username, tweetId };
}

// ============================================================================
// Public API - Pure Functions
// ============================================================================

/**
 * Generate a filename for a media item
 *
 * Filename format priority:
 * 1. media.filename if provided
 * 2. {username}_{tweetId}_{index}.{ext} if username and tweetId available
 * 3. tweet_{tweetId}_{index}.{ext} if only numeric tweetId available
 * 4. {fallbackPrefix}_{timestamp}_{index}.{ext} as fallback
 *
 * @param media - Media info containing URL and metadata
 * @param options - Optional filename generation options
 * @returns Sanitized filename
 *
 * @example
 * ```typescript
 * const filename = generateMediaFilename(media);
 * // => "username_1234567890_1.jpg"
 *
 * const filename = generateMediaFilename(media, { fallbackPrefix: 'gallery' });
 * // => "gallery_1701234567890_1.png"
 * ```
 */
export function generateMediaFilename(media: MediaInfo, options: FilenameOptions = {}): string {
  try {
    if (media.filename) {
      return sanitize(media.filename);
    }

    const extension = options.extension ?? getExtension(media.originalUrl ?? media.url);
    const index = getIndexFromMediaId(media.id) ?? normalizeIndex(options.index);
    const { username, tweetId } = resolveMetadata(media, options.fallbackUsername);

    if (username && tweetId) {
      return sanitize(`${username}_${tweetId}_${index}.${extension}`);
    }

    if (tweetId && /^\d+$/.test(tweetId)) {
      return sanitize(`tweet_${tweetId}_${index}.${extension}`);
    }

    const prefix = options.fallbackPrefix ?? 'media';
    return sanitize(`${prefix}_${Date.now()}_${index}.${extension}`);
  } catch {
    return `media_${Date.now()}.${options.extension || 'jpg'}`;
  }
}

/**
 * Generate a filename for a ZIP archive containing multiple media items
 *
 * @param mediaItems - Array of media items (uses first item for naming)
 * @param options - Optional ZIP filename options
 * @returns Sanitized ZIP filename
 *
 * @example
 * ```typescript
 * const zipName = generateZipFilename(mediaItems);
 * // => "username_1234567890.zip"
 * ```
 */
export function generateZipFilename(
  mediaItems: readonly MediaInfo[],
  options: ZipFilenameOptions = {}
): string {
  try {
    const firstItem = mediaItems[0];
    if (firstItem) {
      const { username, tweetId } = resolveMetadata(firstItem);
      if (username && tweetId) {
        return sanitize(`${username}_${tweetId}.zip`);
      }
    }

    const prefix = options.fallbackPrefix ?? 'xcom_gallery';
    return sanitize(`${prefix}_${Date.now()}.zip`);
  } catch {
    return `download_${Date.now()}.zip`;
  }
}

/**
 * Validate a media filename
 *
 * @param filename - Filename to validate
 * @returns True if filename is valid (non-empty, no reserved characters)
 *
 * @example
 * ```typescript
 * isValidMediaFilename('photo.jpg');  // true
 * isValidMediaFilename('bad<name>');  // false
 * ```
 */
export function isValidMediaFilename(filename: string): boolean {
  return filename.length > 0 && !/[<>:"/\\|?*]/.test(filename);
}

/**
 * Validate a ZIP filename
 *
 * @param filename - Filename to validate
 * @returns True if filename ends with .zip and has no reserved characters
 *
 * @example
 * ```typescript
 * isValidZipFilename('archive.zip');  // true
 * isValidZipFilename('bad|name.zip'); // false
 * ```
 */
export function isValidZipFilename(filename: string): boolean {
  return filename.endsWith('.zip') && !/[<>:"/\\|?*]/.test(filename);
}

// ============================================================================
// Exported Utilities (for advanced use cases)
// ============================================================================

export {
  getExtension as getFileExtension,
  getIndexFromMediaId,
  normalizeIndex,
  resolveMetadata as resolveMediaMetadata,
  sanitize as sanitizeFilename,
};
