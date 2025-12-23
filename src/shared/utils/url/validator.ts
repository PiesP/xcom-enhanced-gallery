/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL validation utilities.
 */

import { MEDIA } from '@constants/media';
import { isHostMatching, tryParseUrl } from '@shared/utils/url/host';

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
