/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL validation utilities.
 */

import { MEDIA } from '@constants/media';
import { isHostMatching, tryParseUrl } from '@shared/utils/url/host';
import { isUrlAllowed, MEDIA_URL_POLICY } from '@shared/utils/url/safety';

/**
 * Maximum allowed URL length for media validation.
 *
 * @remarks
 * Prevents excessively long URLs that may indicate malformed or malicious input.
 * Standard HTTP URL length limit is 2048 characters.
 */
const MAX_URL_LENGTH = 2048 as const;

/**
 * Allowed media CDN hosts for Twitter/X media.
 *
 * @remarks
 * This is derived from the media constant. Kept as a separate variable for
 * performance optimization and clarity in the validation logic.
 */
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
const isHttpProtocol = (protocol: string): boolean => protocol === 'https:' || protocol === 'http:';

/**
 * Enforce host-specific path policy for media URLs.
 *
 * This function routes validation to host-specific path checkers, keeping
 * host allow-listing and path policy separate to prevent policy drift.
 *
 * @internal
 * @param hostname - The hostname to validate (e.g., 'pbs.twimg.com')
 * @param pathname - The pathname to validate against host-specific rules
 * @returns Whether the pathname is allowed for the given hostname
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
 * Validate pbs.twimg.com path for allowed media prefixes.
 *
 * @internal
 * @param pathname - URL pathname to validate
 * @returns Whether the pathname matches an allowed media prefix for pbs.twimg.com
 *
 * @remarks
 * Uses strict prefix matching to prevent substring-based bypasses.
 * Allowed prefixes include media, thumbnails, and video metadata paths.
 */
const checkPbsMediaPath = (pathname: string): boolean =>
  pathname.startsWith('/media/') ||
  pathname.startsWith('/ext_tw_video_thumb/') ||
  pathname.startsWith('/tweet_video_thumb/') ||
  pathname.startsWith('/video_thumb/') ||
  pathname.startsWith('/amplify_video_thumb/');

/**
 * Validate video.twimg.com path for allowed media prefixes.
 *
 * @internal
 * @param pathname - URL pathname to validate
 * @returns Whether the pathname matches an allowed media prefix for video.twimg.com
 *
 * @remarks
 * We intentionally do not accept arbitrary paths on video.twimg.com.
 * Only known media path prefixes (video, thumbnails, DM videos) are allowed.
 * Uses strict prefix matching to prevent substring-based bypasses.
 */
const checkVideoMediaPath = (pathname: string): boolean =>
  pathname.startsWith('/ext_tw_video/') ||
  pathname.startsWith('/tweet_video/') ||
  pathname.startsWith('/amplify_video/') ||
  pathname.startsWith('/dm_video/');
