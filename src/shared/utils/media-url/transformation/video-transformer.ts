/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Video URL transformation utilities.
 */

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Extract and optimize original video URL
 *
 * Optimizes video.twimg.com video quality.
 * Twitter API analysis results:
 * - tag=12: MP4 format (highest quality, recommended)
 * - tag=13: WebM format (mobile optimized)
 * - none: default value (unstable)
 *
 * @param url - Video URL (example: https://video.twimg.com/vi/1234567890/pu.mp4?tag=12)
 * @returns Optimized URL (guarantees tag=12)
 *
 * @example
 * // ✅ Add tag parameter
 * extractOriginalVideoUrl('https://video.twimg.com/vi/1234567890/pu.mp4')
 * // → 'https://video.twimg.com/vi/1234567890/pu.mp4?tag=12'
 *
 * // ✅ Maintain tag=12
 * extractOriginalVideoUrl('https://video.twimg.com/vi/1234567890/pu.mp4?tag=12')
 * // → 'https://video.twimg.com/vi/1234567890/pu.mp4?tag=12'
 *
 * // ✅ Change tag=13 → tag=12
 * extractOriginalVideoUrl('https://video.twimg.com/vi/1234567890/pu.mp4?tag=13')
 * // → 'https://video.twimg.com/vi/1234567890/pu.mp4?tag=12'
 */
export function extractOriginalVideoUrl(url: string): string {
  if (!isNonEmptyString(url)) {
    return url || '';
  }

  try {
    const parsed = new URL(url);

    if (parsed.searchParams.get('tag') === '12') {
      return url;
    }

    parsed.searchParams.set('tag', '12');
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Pre-validation: Check if video original optimization is possible (Phase 330)
 *
 * Checks if URL is video.twimg.com/vi/ format and supports
 * quality optimization through tag parameter.
 *
 * @param url - URL to validate
 * @returns Whether optimization is possible
 *
 * @example
 * // ✅ Original optimization possible
 * canExtractOriginalVideo('https://video.twimg.com/vi/1234567890/pu.mp4')
 *
 * // ✅ Already optimized (still true - state is optimization-capable)
 * canExtractOriginalVideo('https://video.twimg.com/vi/1234567890/pu.mp4?tag=12')
 *
 * // ❌ Optimization not possible (GIF)
 * canExtractOriginalVideo('https://pbs.twimg.com/media/ABC123/video.jpg')
 *
 * // ❌ Optimization not possible (Ad video)
 * canExtractOriginalVideo('https://amplifeed.twimg.com/...')
 */
export function canExtractOriginalVideo(url: string): boolean {
  if (!isNonEmptyString(url)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname === 'video.twimg.com' && parsed.pathname.includes('/vi/');
  } catch {
    return false;
  }
}

/**
 * Extract video ID from video thumbnail URL
 *
 * @param url - Video thumbnail URL
 * @returns Video ID (example: "1931629000243453952") or null
 */
export function extractVideoIdFromThumbnail(url: string): string | null {
  // Remove dependency on isVideoThumbnailUrl() - validate independently
  if (!isNonEmptyString(url)) {
    return null;
  }

  try {
    const urlObj = new URL(url);

    // If not pbs.twimg.com, it's not a thumbnail
    if (urlObj.hostname !== 'pbs.twimg.com') {
      return null;
    }

    // Check video thumbnail pattern
    const isVideoThumb =
      /\/(amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|ad_img\/amplify_video)\//i.test(
        urlObj.pathname
      );

    if (!isVideoThumb) {
      return null;
    }

    // Path example: /amplify_video_thumb/1931629000243453952/img/wzXQeHFbVbPENOya
    // Video ID is the second path segment
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);

    // Find amplify_video_thumb or ext_tw_video_thumb index
    const thumbIndex = pathSegments.findIndex(seg =>
      /^(amplify_video_thumb|ext_tw_video_thumb)$/i.test(seg)
    );

    if (thumbIndex === -1 || thumbIndex + 1 >= pathSegments.length) {
      return null;
    }

    const videoId = pathSegments[thumbIndex + 1];

    // Video ID must be numeric
    if (!videoId || !/^\d+$/.test(videoId)) {
      return null;
    }

    return videoId;
  } catch {
    return null;
  }
}

/**
 * Convert video thumbnail to video URL
 *
 * @param thumbnailUrl - Video thumbnail URL
 * @returns Video URL (video.twimg.com format) or null
 */
export function convertThumbnailToVideoUrl(thumbnailUrl: string): string | null {
  const videoId = extractVideoIdFromThumbnail(thumbnailUrl);
  if (!videoId) {
    return null;
  }

  // Twitter standard video format
  // Example: https://video.twimg.com/vi/1931629000243453952/pu.mp4
  try {
    return new URL(`https://video.twimg.com/vi/${videoId}/pu.mp4`).toString();
  } catch {
    return null;
  }
}
