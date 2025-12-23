/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Pure functional filename utilities
 * @description Stateless filename generation and validation functions
 * @version 4.0.0 - Moved to shared/core (pure module boundary)
 */

import type { MediaInfo } from '@shared/types/media.types';
import { safeParseInt } from '@shared/utils/types/safety';
import { extractUsernameFromUrl } from '@shared/utils/url/host';

// ============================================================================
// Types
// ============================================================================

interface FilenameOptions {
  index?: string | number;
  extension?: string;
  fallbackPrefix?: string;
  fallbackUsername?: string;
  /**
   * Injected time source to keep this module pure.
   * When omitted, 0 is used (deterministic but may collide).
   */
  nowMs?: number;
}

interface ZipFilenameOptions {
  fallbackPrefix?: string;
  /**
   * Injected time source to keep this module pure.
   * When omitted, 0 is used (deterministic but may collide).
   */
  nowMs?: number;
}

interface MediaMetadata {
  username: string | null;
  tweetId: string | null;
}

// ============================================================================
// Internal Pure Functions
// ============================================================================

/**
 * Sanitize filename by replacing reserved characters.
 */
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

/**
 * Extract file extension from URL.
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
 * Extract file extension from URL.
 *
 * This is exported for advanced callers and service-layer facades.
 */
export function getFileExtension(url: string): string {
  return getExtension(url);
}

/**
 * Extract index from media ID.
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
 * Normalize index to string.
 */
export function normalizeIndex(index?: string | number): string {
  if (index === undefined || index === null) return '1';
  const num = typeof index === 'string' ? safeParseInt(index, 10) : index;
  return Number.isNaN(num) || num < 1 ? '1' : num.toString();
}

/**
 * Resolve username and tweetId from media metadata.
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
 * Exported alias for advanced callers.
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
 * Validate a media filename.
 */
export function isValidMediaFilename(filename: string): boolean {
  return filename.length > 0 && !/[<>:"/\\|?*]/.test(filename);
}

/**
 * Validate a ZIP filename.
 */
export function isValidZipFilename(filename: string): boolean {
  return filename.endsWith('.zip') && !/[<>:"/\\|?*]/.test(filename);
}

// ============================================================================
// Exported Utilities (for advanced use cases)
// ============================================================================
