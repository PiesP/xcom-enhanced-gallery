// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { MediaDownloadSource, MediaInfo } from '@shared/types/media.types';
import { isValidMediaUrl } from '@shared/utils/url/validator';

const PHOTO_FORMATS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const PHOTO_SIZES = new Set(['orig', 'large', 'medium', 'small', 'thumb', '900x900', '4096x4096']);

/**
 * Rewrite only ordinary, positively owned CDN photos. Identical case-varied
 * parameters are canonicalized; conflicting duplicates or unknown size/format
 * values remain unverified. Other query data and the encoded identity survive.
 * A null result never authorizes another attachment or an invented original.
 */
export function normalizeOriginalImageUrl(source: string): string | null {
  if (source !== source.trim() || /[\s\\]/u.test(source) || !isValidMediaUrl(source)) return null;
  const parsed = new URL(source);
  if (parsed.hostname !== 'pbs.twimg.com' || parsed.hash) return null;
  const match = parsed.pathname.match(
    /^\/media\/([^/:]+?)(?:\.(jpe?g|png|webp|gif))?(?::([a-z0-9]+))?$/iu
  );
  if (!match) return null;
  try {
    if (!/^[A-Za-z0-9_-]+$/u.test(decodeURIComponent(match[1]!))) return null;
  } catch {
    return null;
  }

  const controls = (key: string): string[] =>
    [...parsed.searchParams]
      .filter(([name]) => name.toLowerCase() === key)
      .map(([, value]) => value.toLowerCase());
  const formats = [...new Set(controls('format'))];
  const sizes = [...new Set(controls('name'))];
  if (formats.length > 1 || sizes.length > 1) return null;
  const format = formats[0] ?? match[2]?.toLowerCase();
  const pathSize = match[3]?.toLowerCase();
  if (!format || !PHOTO_FORMATS.has(format)) return null;
  if (sizes[0] !== undefined && !PHOTO_SIZES.has(sizes[0])) return null;
  if (pathSize && (!PHOTO_SIZES.has(pathSize) || (sizes[0] && sizes[0] !== pathSize))) return null;

  for (const key of [...parsed.searchParams.keys()]) {
    if (key.toLowerCase() === 'format' || key.toLowerCase() === 'name')
      parsed.searchParams.delete(key);
  }
  if (pathSize) parsed.pathname = parsed.pathname.slice(0, -(pathSize.length + 1));
  parsed.searchParams.set('format', format);
  parsed.searchParams.set('name', 'orig');
  return parsed.href;
}

export function getMediaDisplayUrl(media: MediaInfo): string {
  return media.url;
}

export function getImageDownloadSource(
  observedUrl: string,
  provenance: MediaDownloadSource['provenance']
): MediaDownloadSource {
  const original = normalizeOriginalImageUrl(observedUrl);
  return original
    ? { url: original, quality: 'cdn-original', provenance }
    : { url: '', quality: 'unverified-original', provenance };
}

/** Compatibility for existing supplied media; typed sources take precedence. */
export function getMediaDownloadUrl(media: MediaInfo): string {
  return media.downloadSource?.url ?? media.originalUrl ?? media.url;
}
