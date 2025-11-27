/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL validation utilities.
 */

const SUPPORTED_MEDIA_HOSTS = new Set(['pbs.twimg.com', 'video.twimg.com']);
const MAX_URL_LENGTH = 2048;

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

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (!verifyUrlProtocol(parsed.protocol)) {
    return false;
  }

  if (parsed.hostname === 'pbs.twimg.com') {
    return checkPbsMediaPath(parsed.pathname);
  }

  if (parsed.hostname === 'video.twimg.com') {
    return true;
  }

  return false;
}

/**
 * Validate Twitter media domain
 *
 * @internal
 * @param url - URL to validate
 * @returns Whether URL is from Twitter media domain
 */
export function isTwitterMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return SUPPORTED_MEDIA_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Validate URL protocol
 *
 * @internal
 * @param protocol - URL protocol (example: 'https:', 'http:')
 * @returns Whether protocol is https or http
 */
function verifyUrlProtocol(protocol: string): boolean {
  return protocol === 'https:' || protocol === 'http:';
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
    pathname.startsWith('/video_thumb/')
  );
}
