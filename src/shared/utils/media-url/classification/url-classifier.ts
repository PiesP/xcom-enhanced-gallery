/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * URL Classifier
 *
 * Phase 351.4: Classification Layer - URL type classification and filtering
 */

import type { MediaTypeResult } from '../types';

// ===== Media Filter Patterns (Cached Regex) =====
/**
 * Cached regex patterns for performance optimization
 * Phase 331-332: Emoji and video thumbnail filtering
 */
const MEDIA_FILTER_PATTERNS = {
  /** abs[-N].twimg.com hostname pattern for emoji CDN */
  EMOJI_HOSTNAME: /^abs(-\d+)?\.twimg\.com$/i,
  /** /emoji/v<N>/(svg|<size>) path pattern */
  EMOJI_PATH: /\/emoji\/v\d+\/(svg|\d+x\d+)\//i,
  /** Video thumbnail paths: amplify_video_thumb, ext_tw_video_thumb, tweet_video_thumb */
  VIDEO_THUMB_PATH:
    /\/(amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|ad_img\/amplify_video)\//i,
} as const;

/**
 * URL이 Twitter 이모지인지 판별
 *
 * Whether URL is a Twitter emoji (unicode character representation)
 *
 * 3-layer validation:
 * 1. Hostname: abs[-N].twimg.com (CDN distribution)
 * 2. Path: includes /emoji/
 * 3. Format: /emoji/v<N>/<size|svg>/
 *
 * @param url - 검증할 URL
 * @returns 이모지 URL 여부
 *
 * @example
 * ```ts
 * isEmojiUrl('https://abs.twimg.com/emoji/v2/svg/1f600.svg') // true
 * isEmojiUrl('https://abs-0.twimg.com/emoji/v1/72x72/1f44d.png') // true
 * isEmojiUrl('https://pbs.twimg.com/media/ABC123?format=jpg') // false
 * ```
 */
export function isEmojiUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // 1. Hostname validation: abs[-N].twimg.com (emoji served from abs server)
    if (!MEDIA_FILTER_PATTERNS.EMOJI_HOSTNAME.test(urlObj.hostname)) {
      return false;
    }

    // 2. Path validation: includes /emoji/ (identify emoji path)
    if (!urlObj.pathname.includes('/emoji/')) {
      return false;
    }

    // 3. Format validation: /emoji/v<N>/(svg|<size>x<size>)/
    // Example: /emoji/v2/svg/, /emoji/v1/72x72/, /emoji/v2/36x36/
    return MEDIA_FILTER_PATTERNS.EMOJI_PATH.test(urlObj.pathname);
  } catch {
    return false;
  }
}

/**
 * URL이 Twitter 영상 섬네일인지 판별
 *
 * Determine if URL is a Twitter video thumbnail
 *
 * 2-layer validation:
 * 1. Hostname: pbs.twimg.com
 * 2. Path: /amplify_video_thumb/ or /ext_tw_video_thumb/ or /tweet_video_thumb/
 *
 * @param url - 검증할 URL
 * @returns 영상 섬네일 URL 여부
 *
 * @example
 * ```ts
 * isVideoThumbnailUrl('https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg') // true
 * isVideoThumbnailUrl('https://pbs.twimg.com/ext_tw_video_thumb/456/img/def.jpg') // true
 * isVideoThumbnailUrl('https://pbs.twimg.com/media/ABC123?format=jpg') // false
 * ```
 */
export function isVideoThumbnailUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // 1. Hostname validation: pbs.twimg.com (thumbnail server)
    if (urlObj.hostname !== 'pbs.twimg.com') {
      return false;
    }

    // 2. Path validation: video thumbnail pattern matching
    // Example: /amplify_video_thumb/1931629000243453952/img/...
    //          /ext_tw_video_thumb/1234567890/img/...
    //          /tweet_video_thumb/1234567890/img/...
    //          /ad_img/amplify_video/1234567890/...
    return MEDIA_FILTER_PATTERNS.VIDEO_THUMB_PATH.test(urlObj.pathname);
  } catch {
    return false;
  }
}

/**
 * Comprehensive media type classifier
 *
 * Determines the exact type of media URL and whether it should be included in extraction.
 * This is the primary filter for media extraction workflows.
 *
 * @param url - Media URL to classify
 * @returns Classification result with inclusion recommendation
 *
 * @example
 * ```ts
 * classifyMediaUrl('https://pbs.twimg.com/media/ABC123?format=jpg&name=orig')
 * // { type: 'image', shouldInclude: true, hostname: 'pbs.twimg.com' }
 *
 * classifyMediaUrl('https://abs.twimg.com/emoji/v2/svg/1f600.svg')
 * // { type: 'emoji', shouldInclude: false, reason: 'Emoji URLs are filtered', ... }
 *
 * classifyMediaUrl('https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg')
 * // { type: 'video-thumbnail', shouldInclude: false, reason: 'Video thumbnails are skipped (prefer video elements)', ... }
 * ```
 */
export function classifyMediaUrl(url: string): MediaTypeResult {
  if (!url || typeof url !== 'string') {
    return {
      type: 'unknown',
      shouldInclude: false,
      reason: 'Invalid URL: empty or non-string',
    };
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // 1. Check for emoji (highest priority filter)
    if (isEmojiUrl(url)) {
      return {
        type: 'emoji',
        shouldInclude: false,
        reason: 'Emoji URLs are filtered (Phase 331)',
        hostname,
      };
    }

    // 2. Check for video thumbnail (second priority filter)
    if (isVideoThumbnailUrl(url)) {
      return {
        type: 'video-thumbnail',
        shouldInclude: false,
        reason: 'Video thumbnails are skipped (prefer video elements - Phase 332)',
        hostname,
      };
    }

    // 3. Classify valid media types
    if (hostname === 'video.twimg.com') {
      // Only include if it's a proper video path (/ext_tw_video/, /tweet_video/, etc.)
      if (urlObj.pathname.match(/\/(ext_tw_video|tweet_video|amplify_video)\//i)) {
        return {
          type: 'video',
          shouldInclude: true,
          hostname,
        };
      }
      // Unknown video path
      return {
        type: 'unknown',
        shouldInclude: false,
        reason: 'Unsupported video path pattern',
        hostname,
      };
    }

    if (hostname === 'pbs.twimg.com' && urlObj.pathname.includes('/media/')) {
      return {
        type: 'image',
        shouldInclude: true,
        hostname,
      };
    }

    // 4. Unknown or unsupported URL
    return {
      type: 'unknown',
      shouldInclude: false,
      reason: 'Unsupported hostname or path pattern',
      hostname,
    };
  } catch {
    return {
      type: 'unknown',
      shouldInclude: false,
      reason: 'URL parsing failed',
    };
  }
}

/**
 * Check if a URL should be included in media extraction
 *
 * Convenience wrapper around classifyMediaUrl for simple include/exclude decisions.
 *
 * @param url - Media URL to check
 * @returns true if URL should be included, false otherwise
 *
 * @example
 * ```ts
 * shouldIncludeMediaUrl('https://pbs.twimg.com/media/ABC?format=jpg') // true
 * shouldIncludeMediaUrl('https://abs.twimg.com/emoji/v2/svg/1f600.svg') // false
 * shouldIncludeMediaUrl('https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg') // false
 * ```
 */
export function shouldIncludeMediaUrl(url: string): boolean {
  return classifyMediaUrl(url).shouldInclude;
}
