/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Pure functional filename utilities
 * @description
 * Stateless filename generation and validation functions for media downloads.
 * All functions are pure (no side effects, deterministic when nowMs is provided).
 * Time-dependent operations require explicit nowMs injection for testability.
 *
 * @version 4.0.0 - Moved to shared/core (pure module boundary)
 * @module shared/core/filename
 */

import type { MediaInfo } from '@shared/types/media.types';
import { safeParseInt } from '@shared/utils/types/safety';
import { extractUsernameFromUrl } from '@shared/utils/url/host';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for media filename generation.
 *
 * @interface FilenameOptions
 */
interface FilenameOptions {
  /**
   * Media index in the gallery. Will be normalized to a positive integer string.
   * @default "1"
   */
  readonly index?: string | number;

  /**
   * File extension (without dot). Auto-detected from URL if not provided.
   * @example "jpg", "mp4", "png"
   */
  readonly extension?: string;

  /**
   * Prefix to use when username/tweetId unavailable.
   * @default "media"
   */
  readonly fallbackPrefix?: string;

  /**
   * Username to use when extraction from media fails.
   */
  readonly fallbackUsername?: string;

  /**
   * Injected time source to keep this module pure.
   * When omitted, 0 is used (deterministic but may collide).
   * @default 0
   */
  readonly nowMs?: number;
}

/**
 * Options for ZIP archive filename generation.
 *
 * @interface ZipFilenameOptions
 */
interface ZipFilenameOptions {
  /**
   * Prefix to use when username/tweetId unavailable.
   * @default "xcom_gallery"
   */
  readonly fallbackPrefix?: string;

  /**
   * Injected time source to keep this module pure.
   * When omitted, 0 is used (deterministic but may collide).
   * @default 0
   */
  readonly nowMs?: number;
}

/**
 * Extracted metadata from media item for filename generation.
 *
 * @interface MediaMetadata
 */
interface MediaMetadata {
  /**
   * Twitter username (without @ prefix).
   * Null if unable to extract from media data or URL.
   */
  readonly username: string | null;

  /**
   * Tweet ID string.
   * Null if unavailable in media metadata.
   */
  readonly tweetId: string | null;
}

// ============================================================================
// Internal Pure Functions
// ============================================================================

/**
 * Sanitize filename by replacing reserved characters and enforcing length limits.
 *
 * Replaces Windows/UNIX filesystem-forbidden characters with underscores,
 * trims leading/trailing whitespace and dots, and truncates to 255 characters.
 *
 * @param name - Raw filename string to sanitize
 * @returns Sanitized filename, or "media" if result is empty
 *
 * @example
 * sanitize('user<name>:file.jpg') // => 'user_name__file.jpg'
 * sanitize('   ...   ') // => 'media'
 * sanitize('a'.repeat(300)) // => 'aaa...' (255 chars)
 */
function sanitize(name: string): string {
  const sanitized = name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/^[\s.]+|[\s.]+$/g, '')
    .slice(0, 255);
  return sanitized || 'media';
}

/**
 * Resolve timestamp to a valid number, defaulting to 0 for deterministic behavior.
 *
 * @param nowMs - Optional timestamp in milliseconds
 * @returns Valid finite number, or 0 if not provided/invalid
 *
 * @example
 * resolveNowMs(Date.now()) // => 1704672000000
 * resolveNowMs(undefined) // => 0
 * resolveNowMs(NaN) // => 0
 */
function resolveNowMs(nowMs?: number): number {
  return Number.isFinite(nowMs as number) ? (nowMs as number) : 0;
}

/**
 * Extract file extension from URL.
 *
 * Parses URL path (before query string), validates against known media extensions,
 * and normalizes to lowercase. Defaults to 'jpg' for invalid/unknown extensions.
 *
 * @param url - Media URL to extract extension from
 * @returns Lowercase extension string ('jpg', 'mp4', etc.), default 'jpg'
 *
 * @example
 * getExtension('https://pbs.twimg.com/media/abc.png?format=png') // => 'png'
 * getExtension('https://example.com/video.MP4') // => 'mp4'
 * getExtension('https://example.com/unknown.xyz') // => 'jpg'
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
    // URL parsing errors fallback to default
  }
  return 'jpg';
}

/**
 * Extract file extension from URL.
 *
 * Public API wrapper for extension extraction. Exported for advanced callers
 * and service-layer facades that need direct access to extension logic.
 *
 * @param url - Media URL to extract extension from
 * @returns Lowercase extension string ('jpg', 'mp4', etc.), default 'jpg'
 *
 * @see getExtension - Internal implementation
 *
 * @example
 * getFileExtension('https://pbs.twimg.com/media/abc.png') // => 'png'
 */
export function getFileExtension(url: string): string {
  return getExtension(url);
}

/**
 * Extract index from media ID.
 *
 * Parses media IDs with patterns like '_media_0', '_media_1', or '_1', '_2'.
 * For '_media_N' format, returns N+1 (1-indexed). For '_N' format, returns N as-is.
 *
 * @param mediaId - Media identifier string to parse
 * @returns 1-indexed position string, or null if no match
 *
 * @example
 * getIndexFromMediaId('tweet_1234_media_0') // => '1' (0-indexed to 1-indexed)
 * getIndexFromMediaId('tweet_1234_2') // => '2'
 * getIndexFromMediaId('tweet_1234') // => null
 */
export function getIndexFromMediaId(mediaId?: string): string | null {
  if (!mediaId) return null;
  const match = mediaId.match(/_media_(\d+)$/) || mediaId.match(/_(\d+)$/);
  if (match) {
    const idx = safeParseInt(match[1], 10);
    return mediaId.includes('_media_') ? (idx + 1).toString() : (match[1] ?? null);
  }
  return null;
}

/**
 * Normalize index to a positive integer string.
 *
 * Converts string/number index to a valid positive integer string.
 * Invalid values (negative, NaN, null, undefined) default to '1'.
 *
 * @param index - Index value to normalize (string or number)
 * @returns Positive integer string, minimum '1'
 *
 * @example
 * normalizeIndex(3) // => '3'
 * normalizeIndex('5') // => '5'
 * normalizeIndex(-1) // => '1'
 * normalizeIndex(undefined) // => '1'
 * normalizeIndex('invalid') // => '1'
 */
export function normalizeIndex(index?: string | number): string {
  if (index === undefined || index === null) return '1';
  const num = typeof index === 'string' ? safeParseInt(index, 10) : index;
  return Number.isNaN(num) || num < 1 ? '1' : num.toString();
}

/**
 * Resolve username and tweetId from media metadata.
 *
 * Extraction priority:
 * 1. Quoted tweet metadata (if sourceLocation === 'quoted')
 * 2. Direct tweet metadata (tweetUsername, tweetId)
 * 3. Username extraction from URL (with strict host validation)
 * 4. Fallback username parameter
 *
 * @param media - Media item to extract metadata from
 * @param fallbackUsername - Optional fallback username when extraction fails
 * @returns Object with username and tweetId (both nullable)
 *
 * @example
 * resolveMetadata(media, 'fallback_user') // => { username: 'john_doe', tweetId: '1234567890' }
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
        // Use strict host validation for security.
        username = extractUsernameFromUrl(url, { strictHost: true });
      }
    }
  }

  if (!username && fallbackUsername) {
    username = fallbackUsername;
  }

  return { username, tweetId };
}

/**
 * Resolve username and tweetId from media metadata.
 *
 * Public API wrapper for metadata extraction. Exported for advanced callers
 * and service-layer components that need direct access to metadata logic.
 *
 * @param media - Media item to extract metadata from
 * @param fallbackUsername - Optional fallback username when extraction fails
 * @returns Object with username and tweetId (both nullable)
 *
 * @see resolveMetadata - Internal implementation
 *
 * @example
 * const { username, tweetId } = resolveMediaMetadata(media, 'fallback');
 * console.log(`@${username}/status/${tweetId}`);
 */
export function resolveMediaMetadata(
  media: MediaInfo,
  fallbackUsername?: string | null
): MediaMetadata {
  return resolveMetadata(media, fallbackUsername);
}

// ============================================================================
// Public API - Pure Functions
// ============================================================================

/**
 * Generate a filename for a media item.
 *
 * Filename format priority:
 * 1. media.filename (if present) -> sanitized as-is
 * 2. {username}_{tweetId}_{index}.{ext} (if username and tweetId available)
 * 3. tweet_{tweetId}_{index}.{ext} (if only tweetId available)
 * 4. {fallbackPrefix}_{nowMs}_{index}.{ext} (fallback with timestamp)
 *
 * @param media - Media item to generate filename for
 * @param options - Optional configuration for filename generation
 * @returns Sanitized filename string
 *
 * @example
 * // With metadata
 * generateMediaFilename(media, { nowMs: Date.now() })
 * // => 'john_doe_1234567890_1.jpg'
 *
 * // Fallback
 * generateMediaFilename(media, { fallbackPrefix: 'photo', nowMs: Date.now() })
 * // => 'photo_1704672000000_1.jpg'
 */
export function generateMediaFilename(media: MediaInfo, options: FilenameOptions = {}): string {
  try {
    if (media.filename) {
      return sanitize(media.filename);
    }

    const nowMs = resolveNowMs(options.nowMs);

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
    return sanitize(`${prefix}_${nowMs}_${index}.${extension}`);
  } catch {
    const nowMs = resolveNowMs(options.nowMs);
    return `media_${nowMs}.${options.extension || 'jpg'}`;
  }
}

/**
 * Generate a filename for a ZIP archive containing multiple media items.
 *
 * Filename format priority:
 * 1. {username}_{tweetId}.zip (from first media item if available)
 * 2. {fallbackPrefix}_{nowMs}.zip (fallback with timestamp)
 *
 * @param mediaItems - Array of media items to archive (uses first item for metadata)
 * @param options - Optional configuration for ZIP filename generation
 * @returns Sanitized ZIP filename string
 *
 * @example
 * generateZipFilename([media1, media2], { nowMs: Date.now() })
 * // => 'john_doe_1234567890.zip'
 *
 * generateZipFilename([], { fallbackPrefix: 'gallery', nowMs: Date.now() })
 * // => 'gallery_1704672000000.zip'
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
    const nowMs = resolveNowMs(options.nowMs);
    return sanitize(`${prefix}_${nowMs}.zip`);
  } catch {
    const nowMs = resolveNowMs(options.nowMs);
    return `download_${nowMs}.zip`;
  }
}

/**
 * Validate a media filename for filesystem compatibility.
 *
 * Checks that filename is non-empty and contains no reserved characters
 * forbidden by Windows/UNIX filesystems.
 *
 * @param filename - Filename string to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * isValidMediaFilename('photo_1.jpg') // => true
 * isValidMediaFilename('photo:1.jpg') // => false (colon forbidden)
 * isValidMediaFilename('') // => false (empty)
 */
export function isValidMediaFilename(filename: string): boolean {
  return filename.length > 0 && !/[<>:"/\\|?*]/.test(filename);
}

/**
 * Validate a ZIP filename for filesystem compatibility.
 *
 * Checks that filename ends with '.zip' extension and contains no reserved
 * characters forbidden by Windows/UNIX filesystems.
 *
 * @param filename - ZIP filename string to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * isValidZipFilename('archive.zip') // => true
 * isValidZipFilename('archive.tar.gz') // => false (not .zip)
 * isValidZipFilename('archive:1.zip') // => false (colon forbidden)
 */
export function isValidZipFilename(filename: string): boolean {
  return filename.endsWith('.zip') && !/[<>:"/\\|?*]/.test(filename);
}

// ============================================================================
// Exported Utilities (for advanced use cases)
// ============================================================================
