/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL validation utilities.
 */

import { MEDIA } from '@constants/media';
import { isHostMatching, tryParseUrl } from '@shared/utils/url/host';
import { isUrlAllowed, MEDIA_URL_POLICY } from '@shared/utils/url/safety';

const MAX_URL_LENGTH = 2048;
const ALLOWED_MEDIA_HOSTS = MEDIA.HOSTS.MEDIA_CDN;

/**
 * Validate Twitter media URL
 *
 * Multi-layer validation:
 * 1. Basic validation (null, length, protocol)
 * 2. Domain validation (pbs.twimg.com, video.twimg.com)
 * 3. Path validation (media/, video_thumb/, exclude profile)
 *
 * @param url - URL to validate
 * @returns Whether URL is valid
 *
 * @example
 * ```ts
 * isValidMediaUrl('https://pbs.twimg.com/media/ABC?format=jpg') // true
 * isValidMediaUrl('https://video.twimg.com/ext_tw_video/123/pu/vid.mp4') // true
 * isValidMediaUrl('https://pbs.twimg.com/profile_images/123.jpg') // false (profile)
 * isValidMediaUrl('https://example.com/image.jpg') // false (domain mismatch)
 * ```
 */
export function isValidMediaUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length > MAX_URL_LENGTH) {
    return false;
  }

  const parsed = tryParseUrl(url);
  if (!parsed) {
    return false;
  }

  if (!isHttpProtocol(parsed.protocol)) {
    return false;
  }

  if (!isHostMatching(parsed, ALLOWED_MEDIA_HOSTS)) {
    return false;
  }

  return isAllowedMediaPath(parsed.hostname, parsed.pathname);
}

/**
 * Validate that a URL is both safe to handle and a valid Twitter/X media CDN URL.
 *
 * This is a convenience entrypoint intended for callers that want a single
 * predicate covering:
 * - Basic URL safety checks (blocked protocols, control character stripping)
 * - Media host allow-listing and host-specific path policy
 *
 * Notes:
 * - Relative URLs are rejected even though MEDIA_URL_POLICY can allow them.
 * - blob: and data: URLs are rejected even if the safety policy permits them.
 */
export function isSafeAndValidMediaUrl(value: string | URL | null | undefined): boolean {
  const raw = value instanceof URL ? value.toString() : value;
  if (typeof raw !== 'string') {
    return false;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }

  const lower = trimmed.toLowerCase();

  // Reject relative and fragment-only URLs; callers should supply absolute or
  // protocol-relative media URLs.
  if ((lower.startsWith('/') && !lower.startsWith('//')) || lower.startsWith('#')) {
    return false;
  }

  // Reject schemes that are not suitable for media downloads/requests even if
  // the broader safety policy allows them.
  if (lower.startsWith('blob:') || lower.startsWith('data:')) {
    return false;
  }

  if (!isUrlAllowed(trimmed, MEDIA_URL_POLICY)) {
    return false;
  }

  return isValidMediaUrl(trimmed);
}

/**
 * Validate URL protocol.
 *
 * Note: `tryParseUrl()` supports protocol-relative URLs by coercing to `https:`.
 *
 * @internal
 * @param protocol - URL protocol (example: 'https:', 'http:')
 * @returns Whether protocol is https or http
 */
function isHttpProtocol(protocol: string): boolean {
  return protocol === 'https:' || protocol === 'http:';
}

/**
 * Enforce host-specific path policy for media URLs.
 *
 * Keeping host allow-listing and path policy separate helps prevent policy drift.
 */
function isAllowedMediaPath(hostname: string, pathname: string): boolean {
  if (hostname === 'pbs.twimg.com') {
    return checkPbsMediaPath(pathname);
  }

  if (hostname === 'video.twimg.com') {
    return checkVideoMediaPath(pathname);
  }

  return false;
}

/**
 * Validate pbs.twimg.com path
 *
 * @internal
 * @param pathname - URL pathname
 * @returns Whether path is valid media path
 */
function checkPbsMediaPath(pathname: string): boolean {
  // Use strict prefix matching instead of substring search
  return (
    pathname.startsWith('/media/') ||
    pathname.startsWith('/ext_tw_video_thumb/') ||
    pathname.startsWith('/tweet_video_thumb/') ||
    pathname.startsWith('/video_thumb/') ||
    pathname.startsWith('/amplify_video_thumb/')
  );
}

/**
 * Validate video.twimg.com path.
 *
 * We intentionally do not accept arbitrary paths on video.twimg.com.
 * Only known media path prefixes are allowed.
 */
function checkVideoMediaPath(pathname: string): boolean {
  return (
    pathname.startsWith('/ext_tw_video/') ||
    pathname.startsWith('/tweet_video/') ||
    pathname.startsWith('/amplify_video/') ||
    pathname.startsWith('/dm_video/')
  );
}
