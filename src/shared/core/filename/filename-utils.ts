/**
 * @fileoverview Pure functional filename utilities
 * @description Stateless filename generation and validation for media downloads.
 *              All functions are pure; time-dependent operations require nowMs injection.
 */

import type { MediaInfo } from '@shared/types/media.types';
import { safeParseInt } from '@shared/utils/types/safety';
import { extractUsernameFromUrl } from '@shared/utils/url/host';

interface FilenameOptions {
  readonly index?: string | number;
  readonly extension?: string;
  readonly fallbackPrefix?: string;
  readonly fallbackUsername?: string;
  readonly nowMs?: number;
}

interface ZipFilenameOptions {
  readonly fallbackPrefix?: string;
  readonly nowMs?: number;
}

interface MediaMetadata {
  readonly username: string | null;
  readonly tweetId: string | null;
}

// Internal pure functions

function sanitize(name: string): string {
  const sanitized = name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/^[\s.]+|[\s.]+$/g, '')
    .slice(0, 255);
  return sanitized || 'media';
}

function resolveNowMs(nowMs?: number): number {
  return Number.isFinite(nowMs as number) ? (nowMs as number) : 0;
}

function getExtension(url: string): string {
  try {
    const path = url.split('?')[0];
    if (!path) return 'jpg';
    const ext = path.split('.').pop();
    if (ext && /^(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(ext)) {
      return ext.toLowerCase();
    }
  } catch {
    // Fallback to default on parse errors
  }
  return 'jpg';
}

/**
 * Extract file extension from URL.
 * @param url - Media URL to extract extension from
 * @returns Lowercase extension string, default 'jpg'
 */
export function getFileExtension(url: string): string {
  return getExtension(url);
}

/**
 * Extract index from media ID.
 * Parses patterns like '_media_0' → '1' (1-indexed) or '_1' → '1'.
 * @param mediaId - Media identifier string to parse
 * @returns 1-indexed position string, or null if no match
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
 * Invalid values default to '1'.
 * @param index - Index value to normalize
 * @returns Positive integer string, minimum '1'
 */
export function normalizeIndex(index?: string | number): string {
  if (index === undefined || index === null) return '1';
  const num = typeof index === 'string' ? safeParseInt(index, 10) : index;
  return Number.isNaN(num) || num < 1 ? '1' : num.toString();
}

/**
 * Resolve username and tweetId from media metadata.
 * Extraction priority: quoted tweet → direct tweet → URL → fallback.
 * @param media - Media item to extract metadata from
 * @param fallbackUsername - Optional fallback username when extraction fails
 * @returns Object with username and tweetId (both nullable)
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
 * Resolve username and tweetId from media metadata (exported for advanced use).
 * @param media - Media item to extract metadata from
 * @param fallbackUsername - Optional fallback username when extraction fails
 * @returns Object with username and tweetId (both nullable)
 */
export function resolveMediaMetadata(
  media: MediaInfo,
  fallbackUsername?: string | null
): MediaMetadata {
  return resolveMetadata(media, fallbackUsername);
}

// Public API - Pure Functions

/**
 * Generate a filename for a media item.
 * Priority: media.filename → `${username}_${tweetId}_${index}` → `tweet_${tweetId}_${index}` → `${fallbackPrefix}_${nowMs}_${index}`
 * @param media - Media item to generate filename for
 * @param options - Optional configuration for filename generation
 * @returns Sanitized filename string
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
 * Generate a filename for a ZIP archive.
 * Priority: `${username}_${tweetId}.zip` (from first media) → `${fallbackPrefix}_${nowMs}.zip`
 * @param mediaItems - Array of media items to archive (uses first item for metadata)
 * @param options - Optional configuration for ZIP filename generation
 * @returns Sanitized ZIP filename string
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
 * Checks for non-empty and no reserved characters (Windows/UNIX).
 * @param filename - Filename string to validate
 * @returns True if valid, false otherwise
 */
export function isValidMediaFilename(filename: string): boolean {
  return filename.length > 0 && !/[<>:"/\\|?*]/.test(filename);
}

/**
 * Validate a ZIP filename for filesystem compatibility.
 * Must end with '.zip' and contain no reserved characters (Windows/UNIX).
 * @param filename - ZIP filename string to validate
 * @returns True if valid, false otherwise
 */
export function isValidZipFilename(filename: string): boolean {
  return filename.endsWith('.zip') && !/[<>:"/\\|?*]/.test(filename);
}
