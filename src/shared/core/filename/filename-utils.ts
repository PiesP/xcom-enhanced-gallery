// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Pure functional filename utilities
 * @description Stateless filename generation and validation for media downloads.
 *              All functions are pure; time-dependent operations require nowMs injection.
 */

import type { MediaInfo } from '@shared/types/media.types';
import { getMediaDownloadUrl } from '@shared/utils/media/media-source';
import { extractUsernameFromUrl } from '@shared/utils/url/host';

export interface FilenameOptions {
  readonly index?: string | number;
  readonly extension?: string;
  readonly fallbackPrefix?: string;
  readonly fallbackUsername?: string;
  readonly nowMs?: number;
}

export interface ZipFilenameOptions {
  readonly fallbackPrefix?: string;
  readonly nowMs?: number;
}

interface MediaMetadata {
  readonly username: string | null;
  readonly tweetId: string | null;
}

export interface PlannedMediaFilename {
  readonly filename: string;
  /** Generated post/attachment identity to retain when a ZIP collision adds -N. */
  readonly identitySuffix: string;
}

// Internal pure functions

const MAX_BASENAME_UNITS = 255;
const SAFE_EXTENSION = /\.([a-z0-9]{1,16})$/i;
const RESERVED_DEVICE = /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i;

/** Keep a valid Unicode prefix within this validator's 255 UTF-16-unit convention. */
function prefixWithinUnits(value: string, limit: number): string {
  let result = '';
  for (const character of value) {
    if (result.length + character.length > limit) {
      break;
    }
    result += character;
  }
  return result;
}

function suffixWithinUnits(value: string, limit: number): string {
  let result = '';
  const characters = Array.from(value);
  for (let index = characters.length - 1; index >= 0; index--) {
    const character = characters[index];
    if (character === undefined) {
      break;
    }
    if (character.length + result.length > limit) {
      break;
    }
    result = character + result;
  }
  return result;
}

function cleanPart(value: string): string {
  // Array.from exposes lone surrogates as one-unit characters, which cannot form valid Unicode.
  const wellFormed = Array.from(value, (character) =>
    character.length === 1 && /[\uD800-\uDFFF]/.test(character) ? '_' : character
  ).join('');
  /* oxlint-disable no-control-regex -- Windows file names exclude ASCII control characters. */
  return wellFormed.replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '_');
  /* oxlint-enable no-control-regex */
}

/** Finalize one basename after reserving an optional identity/collision suffix and extension. */
export function finalizeFilename(
  name: string,
  options: {
    readonly suffix?: string;
    readonly extension?: string;
    readonly preserveTailUnits?: number;
  } = {}
): string {
  const cleaned = cleanPart(name).replace(/^[\s.]+|[\s.]+$/g, '');
  const matchedExtension = options.extension === undefined ? cleaned.match(SAFE_EXTENSION) : null;
  const requestedExtension = cleanPart(options.extension ?? '').replace(/^\.+|\.+$/g, '');
  const extension =
    options.extension === undefined
      ? (matchedExtension?.[0] ?? '')
      : /^[a-z0-9]{1,16}$/i.test(requestedExtension)
        ? `.${requestedExtension}`
        : '';
  const rawStem = matchedExtension ? cleaned.slice(0, -extension.length) : cleaned;
  const stem = rawStem.replace(/^[\s.]+|[\s.]+$/g, '') || 'media';
  const suffix = prefixWithinUnits(
    cleanPart(options.suffix ?? '').replace(/[\s.]+$/g, ''),
    MAX_BASENAME_UNITS - extension.length - 1
  ).replace(/[\s.]+$/g, '');
  const suffixAndExtension = `${suffix}${extension}`;
  const reservedPrefix = RESERVED_DEVICE.test(`${stem}${suffixAndExtension}`) ? '_' : '';
  const available = Math.max(
    1,
    MAX_BASENAME_UNITS - reservedPrefix.length - suffixAndExtension.length
  );
  const requestedTailUnits = options.preserveTailUnits ?? 0;
  const tailUnits = Math.min(
    Number.isFinite(requestedTailUnits) ? Math.max(0, Math.floor(requestedTailUnits)) : 0,
    Math.floor(available / 2)
  );
  const tail = stem.length > available ? suffixWithinUnits(stem, tailUnits) : '';
  const boundedStem =
    prefixWithinUnits(stem, available - tail.length).replace(/[\s.]+$/g, '') + tail ||
    prefixWithinUnits('media', available);
  return `${reservedPrefix}${boundedStem}${suffixAndExtension}`;
}

/** Add a ZIP collision suffix while retaining the generator-owned identity at the tail. */
export function appendFilenameSuffix(name: string, suffix: string, identitySuffix = ''): string {
  const extensionOffset = name.lastIndexOf('.');
  const extension = extensionOffset > 0 ? name.slice(extensionOffset) : '';
  const stem = extension ? name.slice(0, extensionOffset) : name;
  const identity = identitySuffix && stem.endsWith(identitySuffix) ? identitySuffix : '';
  if (identitySuffix && !identity) {
    throw new RangeError('ZIP filename identity was truncated before collision allocation');
  }
  const prefix = identity ? stem.slice(0, -identity.length) : stem;
  if (identity.length + suffix.length + extension.length + 1 > MAX_BASENAME_UNITS) {
    throw new RangeError('ZIP filename identity leaves no room for a collision suffix');
  }
  const safeExtension = SAFE_EXTENSION.test(extension);
  const candidate = safeExtension
    ? finalizeFilename(prefix, {
        suffix: `${identity}${suffix}`,
        extension: extension.slice(1),
        preserveTailUnits: identity ? 0 : 32,
      })
    : finalizeFilename(prefix, {
        suffix: `${identity}${suffix}${extension}`,
        extension: '',
        preserveTailUnits: identity ? 0 : 32,
      });
  if (candidate === name || !candidate.endsWith(`${identity}${suffix}${extension}`)) {
    throw new RangeError('ZIP filename collision suffix could not be preserved');
  }
  return candidate;
}

/** Compare finalized ZIP names without the final extension, including explicit caller names. */
export function getFilenameStemKey(name: string): string {
  const extensionOffset = name.lastIndexOf('.');
  return (extensionOffset > 0 ? name.slice(0, extensionOffset) : name).toLowerCase();
}

function resolveNowMs(nowMs?: number): number {
  return Number.isFinite(nowMs as number) ? (nowMs as number) : Date.now();
}

function getExtension(url: string): string {
  try {
    // X CDN URL: ?format=jpg&name=orig 등 format= 쿼리 파라미터가 실제 확장자
    const parsed = new URL(url);
    const formatParam = parsed.searchParams.get('format');
    if (formatParam && /^(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(formatParam)) {
      return formatParam.toLowerCase();
    }
    // Fallback: 경로 기반 확장자
    const path = parsed.pathname;
    if (!path) {
      return 'jpg';
    }
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
 * Legacy ID fallback when no explicit attachment identity is available.
 * `_media_0` maps to '1'; generic suffixes such as `_dom_0` retain '0'.
 * @param mediaId - Media identifier string to parse
 * @returns Legacy suffix string, or null if no match
 */
export function getIndexFromMediaId(mediaId?: string): string | null {
  if (!mediaId) {
    return null;
  }
  const match = mediaId.match(/_media_(\d+)$/) || mediaId.match(/_(\d+)$/);
  if (match) {
    const idx = Number.parseInt(match[1] ?? '', 10);
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
function normalizeIndex(index?: string | number): string {
  if (index === undefined || index === null) {
    return '1';
  }
  const num = typeof index === 'string' ? Number.parseInt(index, 10) : index;
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

// Public API - Pure Functions

/**
 * Generate a filename for a media item.
 * Priority: media.filename → `${username}_${tweetId}_${index}` → `tweet_${tweetId}_${index}` → `${fallbackPrefix}_${nowMs}_${index}`
 * @param media - Media item to generate filename for
 * @param options - Optional configuration for filename generation
 * @returns Sanitized filename string
 */
export function generateMediaFilename(media: MediaInfo, options: FilenameOptions = {}): string {
  return planMediaFilename(media, options).filename;
}

/** Keep generated post/attachment identity available to ZIP duplicate allocation. */
export function planMediaFilename(
  media: MediaInfo,
  options: FilenameOptions = {}
): PlannedMediaFilename {
  try {
    if (media.filename) {
      // Explicit names may already carry an attachment identity; retain their tail without
      // treating an arbitrary filename substring as trusted generated metadata.
      return {
        filename: finalizeFilename(media.filename, { preserveTailUnits: 32 }),
        identitySuffix: '',
      };
    }

    const nowMs = resolveNowMs(options.nowMs);
    const extension = options.extension ?? getExtension(getMediaDownloadUrl(media));
    const index =
      (Number.isSafeInteger(media.attachmentOrdinal) && (media.attachmentOrdinal ?? -1) >= 0
        ? String(media.attachmentOrdinal)
        : null) ??
      media.attachmentSourceKey ??
      getIndexFromMediaId(media.id) ??
      normalizeIndex(options.index);
    const { username, tweetId } = resolveMetadata(media, options.fallbackUsername);

    if (username && tweetId) {
      const identitySuffix = cleanPart(`_${tweetId}_${index}`);
      return {
        filename: finalizeFilename(username, { suffix: identitySuffix, extension }),
        identitySuffix,
      };
    }

    if (tweetId && /^\d+$/.test(tweetId)) {
      const identitySuffix = cleanPart(`_${tweetId}_${index}`);
      return {
        filename: finalizeFilename('tweet', { suffix: identitySuffix, extension }),
        identitySuffix,
      };
    }

    const prefix = options.fallbackPrefix ?? 'media';
    const identitySuffix = cleanPart(`_${nowMs}_${index}`);
    return {
      filename: finalizeFilename(prefix, { suffix: identitySuffix, extension }),
      identitySuffix,
    };
  } catch {
    const nowMs = resolveNowMs(options.nowMs);
    return {
      filename: finalizeFilename('media', {
        suffix: `_${nowMs}`,
        extension: options.extension || 'jpg',
      }),
      identitySuffix: `_${nowMs}`,
    };
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
        return finalizeFilename(username, { suffix: `_${tweetId}`, extension: 'zip' });
      }
    }

    const prefix = options.fallbackPrefix ?? 'xcom_gallery';
    const nowMs = resolveNowMs(options.nowMs);
    return finalizeFilename(prefix, { suffix: `_${nowMs}`, extension: 'zip' });
  } catch {
    const nowMs = resolveNowMs(options.nowMs);
    return `download_${nowMs}.zip`;
  }
}
