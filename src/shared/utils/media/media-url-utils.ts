// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Media URL utilities: filename and stem extraction, dedup key generation.
 */

import type { MediaInfo } from '@shared/types/media.types';
import { getCanonicalPhotoIdentity } from '@shared/utils/media/media-source';
import { isHostMatching, tryParseUrl, TWITTER_HOSTS } from '@shared/utils/url/host';

const dedupKeyCache = new WeakMap<MediaInfo, string | null>();

function hasValidUrlPrefix(str: string): boolean {
  return /^(?:https?:\/\/|\/\/|\/)/u.test(str);
}

export function extractFilenameFromUrl(url: string): string | null {
  if (!url) {
    return null;
  }
  const trimmed = url.trim();
  if (!trimmed || !hasValidUrlPrefix(trimmed)) {
    return null;
  }
  const parsed = tryParseUrl(trimmed, 'https://example.invalid');
  if (!parsed) {
    return null;
  }
  const filename = parsed.pathname.split('/').pop();
  return filename && filename.length > 0 ? filename : null;
}

export function getMediaDedupKey(media: MediaInfo): string | null {
  const cached = dedupKeyCache.get(media);
  if (cached !== undefined) {
    return cached;
  }

  const urlCandidate =
    typeof media.originalUrl === 'string' && media.originalUrl.length > 0
      ? media.originalUrl
      : typeof media.url === 'string' && media.url.length > 0
        ? media.url
        : null;

  if (!urlCandidate) {
    dedupKeyCache.set(media, null);
    return null;
  }

  const typePrefix =
    media.type === 'image' || media.type === 'video' || media.type === 'gif'
      ? `${media.type}:`
      : '';
  // Different quote owners can reuse a source; collapsing them changes the
  // clicked post's attribution and download filename.
  const ownerPrefix = media.tweetId ? `tweet:${media.tweetId}:` : '';
  // Producers validate positions before assigning them. A verified collection
  // can contain two different attachments that reuse one transport source.
  const ordinalPrefix =
    Number.isSafeInteger(media.attachmentOrdinal) && (media.attachmentOrdinal ?? -1) >= 0
      ? `attachment:${media.attachmentOrdinal}:`
      : '';
  const apiData = media.metadata?.apiData as Record<string, unknown> | undefined;
  const entityPrefix =
    media.tweetId && typeof apiData?.media_id === 'string' && apiData.media_id.length > 0
      ? `entity:${apiData.media_id}:`
      : ordinalPrefix;
  const prefix = `${typePrefix}${ownerPrefix}${entityPrefix}`;

  const photo = media.type === 'image' ? getCanonicalPhotoIdentity(urlCandidate) : null;
  if (photo) {
    const key = `${prefix}${photo}`;
    dedupKeyCache.set(media, key);
    return key;
  }

  const parsed = tryParseUrl(urlCandidate, 'https://example.invalid');
  if (parsed) {
    const host = parsed.hostname;
    const path = parsed.pathname;
    const format = parsed.searchParams.get('format');
    if (host && path) {
      const key = `${prefix}${host}${path}${format ? `?format=${format}` : ''}`;
      dedupKeyCache.set(media, key);
      return key;
    }
  }

  const filename = extractFilenameFromUrl(urlCandidate);
  const key = filename ? `${prefix}${filename}` : `${prefix}${urlCandidate}`;
  dedupKeyCache.set(media, key);
  return key;
}

/** A navigation position is evidence only for its named owner and media kind. */
export function getOwnedNavigationOrdinal(
  source: string,
  tweetId: string,
  username?: string,
  kind?: 'photo' | 'video'
): number | null {
  const url = tryParseUrl(source);
  const match = url?.pathname.match(/^\/([^/]+)\/status\/(\d+)\/(photo|video)\/([1-9]\d*)\/?$/u);
  if (
    url?.protocol !== 'https:' ||
    !isHostMatching(url, TWITTER_HOSTS) ||
    match?.[2] !== tweetId ||
    (username !== undefined && match[1]?.toLowerCase() !== username.toLowerCase()) ||
    (kind !== undefined && match[3] !== kind)
  ) {
    return null;
  }
  const ordinal = Number(match[4]) - 1;
  return Number.isSafeInteger(ordinal) ? ordinal : null;
}

export function extractVisualIndexFromUrl(url: string): number {
  if (!url) {
    return 0;
  }
  const match = url.match(/\/(photo|video)\/(\d+)(?:[?#].*)?$/);
  const visualNumber = match?.[2] ? Number.parseInt(match[2], 10) : NaN;
  return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
}

export function extractFilenameStemFromUrl(url: string): string | null {
  if (!url) {
    return null;
  }
  const trimmed = url.trim();
  if (!trimmed || !hasValidUrlPrefix(trimmed)) {
    return null;
  }

  const parsed = tryParseUrl(trimmed, 'https://example.invalid');
  if (!parsed) {
    return null;
  }

  let filename = parsed.pathname.split('/').pop();
  if (!filename) {
    return null;
  }

  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex !== -1) {
    filename = filename.substring(0, dotIndex);
  }

  return filename && filename.length > 0 ? filename : null;
}
