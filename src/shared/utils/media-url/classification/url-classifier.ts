/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * URL classifier utilities.
 */

import type { MediaTypeResult } from "@shared/utils/media-url/types";
import { isNonEmptyString } from "@shared/utils/type-guards";

const TWITTER_EMOJI_HOST_PATTERN = /^abs(?:-\d+)?\.twimg\.com$/i;
const TWITTER_EMOJI_PATH_PATTERN = /\/emoji\/v\d+\/(?:svg|\d+x\d+)\//i;
const TWITTER_VIDEO_THUMB_PATH_PATTERN =
  /\/(?:amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|ad_img\/amplify_video)\//i;
const TWITTER_VIDEO_CONTENT_PATH_PATTERN =
  /\/(?:ext_tw_video|tweet_video|amplify_video)\//i;

const EMOJI_SEGMENT = "/emoji/";
const MEDIA_SEGMENT = "/media/";

function safeParseUrl(rawUrl: string): URL | null {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

function matchesEmoji(parsed: URL): boolean {
  return (
    TWITTER_EMOJI_HOST_PATTERN.test(parsed.hostname) &&
    parsed.pathname.includes(EMOJI_SEGMENT) &&
    TWITTER_EMOJI_PATH_PATTERN.test(parsed.pathname)
  );
}

function matchesVideoThumbnail(parsed: URL): boolean {
  const isTwitterCdnHost = parsed.hostname === "pbs.twimg.com";
  const matchesThumbnailPath = TWITTER_VIDEO_THUMB_PATH_PATTERN.test(
    parsed.pathname,
  );
  return isTwitterCdnHost && matchesThumbnailPath;
}

function classifyVideoHost(parsed: URL): MediaTypeResult {
  if (TWITTER_VIDEO_CONTENT_PATH_PATTERN.test(parsed.pathname)) {
    return {
      type: "video",
      shouldInclude: true,
      hostname: parsed.hostname,
    };
  }

  return {
    type: "unknown",
    shouldInclude: false,
    reason: "Unsupported video path pattern",
    hostname: parsed.hostname,
  };
}

function classifyImageHost(parsed: URL): MediaTypeResult {
  if (parsed.pathname.includes(MEDIA_SEGMENT)) {
    return {
      type: "image",
      shouldInclude: true,
      hostname: parsed.hostname,
    };
  }

  return {
    type: "unknown",
    shouldInclude: false,
    reason: "Unsupported image path pattern",
    hostname: parsed.hostname,
  };
}

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
  if (!isNonEmptyString(url)) {
    return false;
  }

  const parsed = safeParseUrl(url.trim());
  return parsed ? matchesEmoji(parsed) : false;
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
  if (!isNonEmptyString(url)) {
    return false;
  }

  const parsed = safeParseUrl(url.trim());
  return parsed ? matchesVideoThumbnail(parsed) : false;
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
  if (!isNonEmptyString(url)) {
    return {
      type: "unknown",
      shouldInclude: false,
      reason: "Invalid URL: empty or non-string",
    };
  }

  const trimmedUrl = url.trim();
  const parsed = safeParseUrl(trimmedUrl);

  if (!parsed) {
    return {
      type: "unknown",
      shouldInclude: false,
      reason: "URL parsing failed",
    };
  }

  const hostname = parsed.hostname;

  if (matchesEmoji(parsed)) {
    return {
      type: "emoji",
      shouldInclude: false,
      reason: "Emoji URLs are filtered",
      hostname,
    };
  }

  if (matchesVideoThumbnail(parsed)) {
    return {
      type: "video-thumbnail",
      shouldInclude: false,
      reason: "Video thumbnails are skipped",
      hostname,
    };
  }

  if (hostname === "video.twimg.com") {
    return classifyVideoHost(parsed);
  }

  if (hostname === "pbs.twimg.com") {
    return classifyImageHost(parsed);
  }

  return {
    type: "unknown",
    shouldInclude: false,
    reason: "Unsupported hostname or path pattern",
    hostname,
  };
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
