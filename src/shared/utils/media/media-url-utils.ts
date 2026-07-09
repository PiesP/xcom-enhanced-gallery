// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Media URL utilities: filename extraction, dedup key generation, URL normalization.
 */

import type { MediaInfo } from '@shared/types/media.types';
import { tryParseUrl } from '@shared/utils/url/host';

const dedupKeyCache = new WeakMap<object, string | null>();

function hasValidUrlPrefix(str: string): boolean {
  return /^(?:https?:\/\/|\/\/|\/)/u.test(str);
}

function extractFilenameFromUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || !hasValidUrlPrefix(trimmed)) return null;
  const parsed = tryParseUrl(trimmed, 'https://example.invalid');
  if (!parsed) return null;
  const filename = parsed.pathname.split('/').pop();
  return filename && filename.length > 0 ? filename : null;
}

export function getMediaDedupKey(media: MediaInfo): string | null {
  const cached = dedupKeyCache.get(media as unknown as object);
  if (cached !== undefined) return cached;

  const urlCandidate =
    typeof media.originalUrl === 'string' && media.originalUrl.length > 0
      ? media.originalUrl
      : typeof media.url === 'string' && media.url.length > 0
        ? media.url
        : null;

  if (!urlCandidate) {
    dedupKeyCache.set(media as unknown as object, null);
    return null;
  }

  const typePrefix =
    media.type === 'image' || media.type === 'video' || media.type === 'gif'
      ? `${media.type}:`
      : '';

  const parsed = tryParseUrl(urlCandidate, 'https://example.invalid');
  if (parsed) {
    const host = parsed.hostname;
    const path = parsed.pathname;
    const format = parsed.searchParams.get('format');
    if (host && path) {
      const key = `${typePrefix}${host}${path}${format ? `?format=${format}` : ''}`;
      dedupKeyCache.set(media as unknown as object, key);
      return key;
    }
  }

  const filename = extractFilenameFromUrl(urlCandidate);
  const key = filename ? `${typePrefix}${filename}` : `${typePrefix}${urlCandidate}`;
  dedupKeyCache.set(media as unknown as object, key);
  return key;
}

export function extractVisualIndexFromUrl(url: string): number {
  if (!url) return 0;
  const match = url.match(/\/(photo|video)\/(\d+)(?:[?#].*)?$/);
  const visualNumber = match?.[2] ? Number.parseInt(match[2], 10) : NaN;
  return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
}

export function normalizeMediaUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || !hasValidUrlPrefix(trimmed)) return null;

  const parsed = tryParseUrl(trimmed, 'https://example.invalid');
  if (!parsed) return null;

  let filename = parsed.pathname.split('/').pop();
  if (!filename) return null;

  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex !== -1) {
    filename = filename.substring(0, dotIndex);
  }

  return filename && filename.length > 0 ? filename : null;
}
