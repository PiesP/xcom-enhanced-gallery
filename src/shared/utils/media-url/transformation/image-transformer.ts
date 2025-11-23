/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Image URL transformation utilities.
 */

import { URL_PATTERNS } from "@shared/utils/patterns/url-patterns";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Extract original high-quality image URL from Twitter image
 *
 * Extracts original high-quality version by setting 'orig' parameter.
 * Falls back to string manipulation strategy if URL parsing fails.
 *
 * @param url - Original image URL
 * @returns Original high-quality URL (with 'name=orig' parameter)
 *
 * @example
 * // Standard URL
 * extractOriginalImageUrl('https://pbs.twimg.com/media/ABC123?format=jpg&name=small')
 * // Returns: 'https://pbs.twimg.com/media/ABC123?format=jpg&name=orig'
 *
 * // Already set to orig
 * extractOriginalImageUrl('https://pbs.twimg.com/media/ABC123?format=jpg&name=orig')
 * // Returns: 'https://pbs.twimg.com/media/ABC123?format=jpg&name=orig' (unchanged)
 */
export function extractOriginalImageUrl(url: string): string {
  if (!isNonEmptyString(url)) {
    return url || "";
  }

  try {
    const parsed = new URL(url);

    if (parsed.searchParams.get("name") === "orig") {
      return url;
    }

    parsed.searchParams.set("name", "orig");
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Check if original image extraction is possible
 *
 * Validates if URL supports 'orig' parameter.
 * Only Twitter image URLs with pbs.twimg.com/media/ path support original version.
 *
 * @param url - URL to validate
 * @returns Whether original extraction is possible
 *
 * @example
 * // ✅ Original extraction possible
 * canExtractOriginalImage('https://pbs.twimg.com/media/ABC123?format=jpg&name=small')
 *
 * // ❌ Original extraction not possible (already orig)
 * canExtractOriginalImage('https://pbs.twimg.com/media/ABC123?format=jpg&name=orig')
 *
 * // ❌ Original extraction not possible (video)
 * canExtractOriginalImage('https://video.twimg.com/...')
 */
export function canExtractOriginalImage(url: string): boolean {
  if (!isNonEmptyString(url)) {
    return false;
  }

  try {
    const parsed = new URL(url);

    if (parsed.searchParams.get("name") === "orig") {
      return false;
    }
    return (
      parsed.hostname === "pbs.twimg.com" &&
      parsed.pathname.startsWith("/media/")
    );
  } catch {
    return false;
  }
}

/**
 * Extract media ID from URL
 *
 * Supports both standard media URLs and video thumbnail URLs.
 *
 * @param url - Media URL
 * @returns Extracted media ID or null
 */
export function extractMediaId(url: string): string | null {
  if (!isNonEmptyString(url)) {
    return null;
  }

  const match = url.match(URL_PATTERNS.MEDIA_ID);
  if (match?.[1]) return match[1];

  const videoMatch = url.match(URL_PATTERNS.VIDEO_THUMB_ID);
  // For ext_tw_video_thumb|video_thumb, group 1 captures the media id (e.g., ZZYYXX)
  // For tweet_video_thumb, group 2 captures the id
  if (videoMatch) {
    return videoMatch[1] || videoMatch[2] || null;
  }

  return null;
}

/**
 * Convert video thumbnail URL to original media URL
 *
 * @param url - Video thumbnail URL
 * @returns Original media URL or null
 */
export function generateOriginalUrl(url: string): string | null {
  const mediaId = extractMediaId(url);
  if (!mediaId) return null;

  let format = "jpg";

  if (isNonEmptyString(url)) {
    try {
      const parsed = new URL(url);
      format = parsed.searchParams.get("format") ?? format;
    } catch {
      const formatMatch = url.match(/[?&]format=([^&]+)/);
      if (formatMatch?.[1]) {
        format = formatMatch[1];
      }
    }
  }

  return `https://pbs.twimg.com/media/${mediaId}?format=${format}&name=orig`;
}
