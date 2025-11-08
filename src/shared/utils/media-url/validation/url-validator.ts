/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * URL Validator
 *
 * Phase 351.3: Validation Layer - URL validation
 */

import { logger } from '../../../logging';

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
  if (!url || typeof url !== 'string') {
    return false;
  }

  // URL length limit (common browser limit of 2048 chars)
  if (url.length > 2048) {
    return false;
  }

  try {
    // Check URL constructor availability in test environment
    let URLConstructor: typeof URL | undefined;

    if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
      URLConstructor = globalThis.URL;
    } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
      URLConstructor = window.URL;
    } else {
      // Test environment fallback if needed
      // Browser environment always has globalThis.URL or window.URL available
      return isValidMediaUrlFallback(url);
    }

    if (!URLConstructor) {
      return isValidMediaUrlFallback(url);
    }

    const urlObj = new URLConstructor(url);

    // Validate protocol
    if (!verifyUrlProtocol(urlObj.protocol)) {
      return false;
    }

    // Validate path by domain
    if (urlObj.hostname === 'pbs.twimg.com') {
      return checkPbsMediaPath(urlObj.pathname);
    }

    if (urlObj.hostname === 'video.twimg.com') {
      // video.twimg.com allows all paths
      return true;
    }

    // Other domains not supported (Twitter media only)
    return false;
  } catch (error) {
    // URL parsing failed - use fallback
    logger.warn('URL parsing failed, using fallback:', error);
    return isValidMediaUrlFallback(url);
  }
}

/**
 * Validate Twitter media domain
 *
 * @internal
 * @param url - URL to validate
 * @returns Whether URL is from Twitter media domain
 */
export function isTwitterMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'pbs.twimg.com' || urlObj.hostname === 'video.twimg.com';
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
  // pbs.twimg.com must include /media/ or video thumbnail path, excluding profile_images
  const isMedia = pathname.includes('/media/');
  const isVideoThumb =
    /\/ext_tw_video_thumb\//.test(pathname) ||
    /\/tweet_video_thumb\//.test(pathname) ||
    /\/video_thumb\//.test(pathname);

  return (isMedia || isVideoThumb) && !pathname.includes('/profile_images/');
}

/**
 * Fallback validation function for environments without URL constructor
 *
 * @internal
 * @param url - URL to validate
 * @returns Whether URL is valid
 */
function isValidMediaUrlFallback(url: string): boolean {
  // Basic protocol check
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return false;
  }

  // Domain spoofing prevention: exact hostname matching
  const protocolRegex = /^https?:\/\/([^/?#]+)/;
  const match = url.match(protocolRegex);
  if (!match) {
    return false;
  }

  const hostname = match[1];

  // Twitter media domain exact check
  if (hostname === 'pbs.twimg.com') {
    const isMedia = url.includes('/media/');
    const isVideoThumb =
      url.includes('/ext_tw_video_thumb/') ||
      url.includes('/tweet_video_thumb/') ||
      url.includes('/video_thumb/');
    return (isMedia || isVideoThumb) && !url.includes('/profile_images/');
  }

  if (hostname === 'video.twimg.com') {
    return true;
  }

  // Explicitly reject unsupported domains
  return false;
}
