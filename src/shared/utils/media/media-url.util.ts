/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL Utility
 *
 * Utility functions to extract actual media URLs from tweets.
 * Used together with BackgroundTweetLoader to provide accurate media information.
 */

import { logger } from '@shared/logging';
import { getMediaFilenameService } from '@shared/container/service-accessors';
import type { FilenameOptions } from '@shared/services/file-naming';
// Username은 shared/media/username-source 헬퍼를 통해 제공
import { getPreferredUsername } from '../../media/username-source';
export type { FilenameOptions };
import type { MediaInfo } from '../../types/media.types';
import { cachedQuerySelector, cachedQuerySelectorAll } from '../../dom';
import { SELECTORS } from '@/constants';
import { URL_PATTERNS } from '../patterns/url-patterns';

/**
 * Extract media URLs from tweet document
 *
 * @param doc - Document or documentElement where tweet is loaded
 * @param tweetId - Tweet ID
 * @returns Array of extracted media information
 */
export function getMediaUrlsFromTweet(doc: Document | HTMLElement, tweetId: string): MediaInfo[] {
  const mediaItems: MediaInfo[] = [];
  let mediaIndex = 0;

  try {
    // For Document, use documentElement
    const rootElement = doc instanceof Document ? doc.documentElement : doc;

    // ===== Phase 1: Extract video media first (actual video elements) =====
    // Extract actual video elements first to use correct URLs
    const videos = cachedQuerySelectorAll('video', rootElement, 2000);

    if (videos && videos.length > 0) {
      Array.from(videos).forEach(video => {
        const videoElement = video as HTMLVideoElement;
        const mediaInfo = createMediaInfoFromVideo(videoElement, tweetId, mediaIndex);
        if (mediaInfo) {
          mediaItems.push(mediaInfo);
          mediaIndex++;
        }
      });
    }

    // ===== Phase 2: Extract image media =====
    // Extract image media (using cached queries)
    // Primary selector uses substring for performance/compatibility,
    // but re-validate with isTwitterMediaUrl() (prevents domain spoofing)
    const images = cachedQuerySelectorAll('img[src*="pbs.twimg.com"]', rootElement, 3000);
    if (images && images.length > 0) {
      for (const img of Array.from(images)) {
        const imgElement = img as HTMLImageElement;
        const src = imgElement.src;

        // Extract only real media, not thumbnails or profile images
        // Exclude emojis (Phase 331)
        // Exclude video thumbnails (Phase 332)
        if (
          !isTwitterMediaUrl(src) ||
          !src.includes('/media/') ||
          src.includes('profile_images') ||
          isEmojiUrl(src) ||
          isVideoThumbnailUrl(src)
        ) {
          continue;
        }

        // Process general image
        const mediaInfo = createMediaInfoFromImage(imgElement, tweetId, mediaIndex);
        if (mediaInfo) {
          mediaItems.push(mediaInfo);
          mediaIndex++;
        }
      }
    }

    // Additional: check data-testid="tweetPhoto" and data-testid="videoPlayer" elements (cached queries)
    const tweetPhotos = cachedQuerySelectorAll(SELECTORS.TWEET_PHOTO, rootElement, 3000);
    if (tweetPhotos && tweetPhotos.length > 0) {
      for (const photo of Array.from(tweetPhotos)) {
        const imgElement = cachedQuerySelector('img', photo as Element, 2000) as HTMLImageElement;
        if (!imgElement?.src || !isTwitterMediaUrl(imgElement.src)) {
          continue;
        }

        // Exclude emojis
        if (isEmojiUrl(imgElement.src)) {
          continue;
        }

        // Exclude video thumbnails (Phase 332)
        if (isVideoThumbnailUrl(imgElement.src)) {
          continue;
        }

        // Process general image
        const mediaInfo = createMediaInfoFromImage(imgElement, tweetId, mediaIndex);
        if (mediaInfo && !mediaItems.some(item => item.url === mediaInfo.url)) {
          mediaItems.push(mediaInfo);
          mediaIndex++;
        }
      }
    }

    logger.debug(`getMediaUrlsFromTweet: ${mediaItems.length} media extracted - ${tweetId}`);
    return mediaItems;
  } catch (error) {
    logger.error('getMediaUrlsFromTweet: Media extraction failed:', error);
    return [];
  }
}

/**
 * Create MediaInfo from image element
 */
export function createMediaInfoFromImage(
  imgElement: HTMLImageElement,
  tweetId: string,
  index: number
): MediaInfo | null {
  try {
    const src = imgElement.src;
    const alt = imgElement.alt || `Media ${index + 1} from tweet`;

    // Validate URL
    if (!isValidMediaUrl(src)) {
      return null;
    }

    // Extract original URL (convert to orig version)
    const originalUrl = extractOriginalImageUrl(src);

    // Thumbnail URL (small version)
    const thumbnailUrl = `${src.replace(/[?&]name=[^&]*/, '').replace(/[?&]format=[^&]*/, '')}?format=jpg&name=small`;

    // Generate single source filename based on user/tweet info
    const username = getUsernameSafe() || undefined;
    const tempInfo: Partial<MediaInfo> = {
      id: `${tweetId}-${index}`,
      url: originalUrl,
      type: 'image',
      tweetId,
      tweetUsername: username,
    } as const;
    const filename = getFilename(
      tempInfo as MediaInfo,
      username
        ? {
            index: index + 1,
            // Pass fallbackUsername for standard format consistency
            fallbackUsername: username,
          }
        : { index: index + 1 }
    );

    return {
      id: `${tweetId}-${index}`,
      type: 'image',
      url: originalUrl,
      thumbnailUrl,
      originalUrl: `https://twitter.com/i/status/${tweetId}/photo/${index + 1}`,
      tweetId,
      filename,
      tweetUsername: getUsernameSafe() || undefined,
      tweetUrl: `https://twitter.com/i/status/${tweetId}`,
      alt,
      width: imgElement.width || 1200,
      height: imgElement.height || 800,
    };
  } catch (error) {
    logger.error('createMediaInfoFromImage: Image info creation failed:', error);
    return null;
  }
}

/**
 * Create MediaInfo from video element
 */
export function createMediaInfoFromVideo(
  videoElement: HTMLVideoElement,
  tweetId: string,
  index: number
): MediaInfo | null {
  try {
    const poster = videoElement.poster || '';
    const src = videoElement.src || videoElement.currentSrc || '';

    // Verify there is a valid video URL
    if (!src && !poster) {
      return null;
    }

    // Host validation: only video.twimg.com or pbs.twimg.com (thumbnail) allowed
    const primary = src || poster;
    if (!isTwitterMediaUrl(primary)) {
      return null;
    }

    // Phase 330: Video URL optimization (tag=12 for MP4 quality assurance)
    let optimizedVideoUrl = src;
    if (src && canExtractOriginalVideo(src)) {
      optimizedVideoUrl = extractOriginalVideoUrl(src);
      logger.debug('createMediaInfoFromVideo: Video URL optimization (Phase 330)', {
        videoId: `${tweetId}-video-${index}`,
        original: src,
        optimized: optimizedVideoUrl,
        changed: src !== optimizedVideoUrl,
      });
    }

    // Generate single source filename based on user/tweet info
    const username = getUsernameSafe() || undefined;
    const tempInfo: Partial<MediaInfo> = {
      id: `${tweetId}-video-${index}`,
      url: optimizedVideoUrl || poster, // Use optimized URL or poster
      type: 'video',
      tweetId,
      tweetUsername: username,
    } as const;
    // Extract extension from source URL first for accuracy (mp4 etc)
    let ext: string | undefined;
    try {
      const sourceUrl = optimizedVideoUrl || poster; // Extract extension from optimized URL
      const m = sourceUrl.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
      ext = m?.[1]?.toLowerCase();
    } catch {
      // ignore parse errors; fallback extension logic in FilenameService will apply
    }
    const options: { index: number } | { index: number; extension: string } = ext
      ? { index: index + 1, extension: ext }
      : { index: index + 1 };
    const filename = getFilename(
      tempInfo as MediaInfo,
      username
        ? ({ ...(options as FilenameOptions), fallbackUsername: username } as FilenameOptions)
        : (options as FilenameOptions)
    );

    return {
      id: `${tweetId}-video-${index}`,
      type: 'video',
      url: optimizedVideoUrl || poster, // Use optimized video URL (Phase 330)
      thumbnailUrl: poster,
      originalUrl: `https://twitter.com/i/status/${tweetId}/video/${index + 1}`,
      tweetId,
      filename,
      tweetUsername: getUsernameSafe() || undefined,
      tweetUrl: `https://twitter.com/i/status/${tweetId}`,
      alt: `Video ${index + 1} from tweet`,
      width: videoElement.videoWidth || 1920,
      height: videoElement.videoHeight || 1080,
    };
  } catch (error) {
    logger.error('createMediaInfoFromVideo: Video info creation failed:', error);
    return null;
  }
}

/**
 * Extract original high-quality URL from Twitter image
 *
 * Extracts the 'orig' parameter from image URLs to get the original high-quality version.
 * Falls back to a string-based strategy if parsing fails.
 *
 * @param url - Original image URL
 * @returns Original high-quality URL (with 'name=orig' parameter)
 *
 * @example
 * // Standard URL
 * extractOriginalImageUrl('https://pbs.twimg.com/media/ABC123?format=jpg&name=small')
 * // Returns: 'https://pbs.twimg.com/media/ABC123?format=jpg&name=orig'
 *
 * // Already orig set
 * extractOriginalImageUrl('https://pbs.twimg.com/media/ABC123?format=jpg&name=orig')
 * // Returns: 'https://pbs.twimg.com/media/ABC123?format=jpg&name=orig' (same)
 */
export function extractOriginalImageUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    logger.warn('extractOriginalImageUrl: URL is empty or not a string', { url });
    return url;
  }

  try {
    const urlObj = new URL(url);

    // Check current name parameter
    const currentName = urlObj.searchParams.get('name');

    // If orig is already set, return as is
    if (currentName === 'orig') {
      logger.debug('extractOriginalImageUrl: Already has orig parameter', { url });
      return url;
    }

    // Set name parameter to orig
    urlObj.searchParams.set('name', 'orig');
    const result = urlObj.toString();

    logger.debug('extractOriginalImageUrl: Original URL extracted successfully', {
      originalUrl: url,
      extractedUrl: result,
      previousName: currentName,
    });

    return result;
  } catch (error) {
    // Fallback strategy if URL parsing fails
    logger.debug('extractOriginalImageUrl: URL parsing failed, using fallback strategy', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });

    // If name parameter already exists, replace it with orig
    if (url.includes('?')) {
      const result = `${url.replace(/[?&]name=[^&]*/, '')}&name=orig`;
      logger.debug(
        'extractOriginalImageUrl: String-based original URL extraction (replace existing name)',
        {
          result,
        }
      );
      return result;
    }

    // If no name parameter, add it
    const result = `${url}?name=orig`;
    logger.debug(
      'extractOriginalImageUrl: String-based original URL extraction (new name parameter)',
      {
        result,
      }
    );
    return result;
  }
}

/**
 * Verify URL is from Twitter media domain (simple helper)
 *
 * @param url - URL to validate
 * @returns Whether the URL is from Twitter media domain
 */
function isTwitterMediaUrl(url: string): boolean {
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
 * Media type discriminator result
 */
export interface MediaTypeResult {
  /** Media type classification */
  type: 'image' | 'video' | 'emoji' | 'video-thumbnail' | 'unknown';
  /** Whether this media should be included in extraction */
  shouldInclude: boolean;
  /** Reason for filtering (if shouldInclude is false) */
  reason?: string;
  /** Validated hostname */
  hostname?: string;
}

/**
 * Check if URL is a Twitter emoji
 *
 * 3-layer validation:
 * 1. Hostname: abs[-N].twimg.com (CDN distribution)
 * 2. Path: /emoji/ included
 * 3. Format: /emoji/v<N>/<size|svg>/
 *
 * @param url - URL to validate
 * @returns Whether the URL is an emoji URL
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

    // 1. Check hostname: abs[-N].twimg.com (emoji served from abs servers)
    if (!MEDIA_FILTER_PATTERNS.EMOJI_HOSTNAME.test(urlObj.hostname)) {
      return false;
    }

    // 2. Check path: /emoji/ included (emoji path identifier)
    if (!urlObj.pathname.includes('/emoji/')) {
      return false;
    }

    // 3. Check format: /emoji/v<N>/(svg|<size>x<size>)/
    // Example: /emoji/v2/svg/, /emoji/v1/72x72/, /emoji/v2/36x36/
    return MEDIA_FILTER_PATTERNS.EMOJI_PATH.test(urlObj.pathname);
  } catch {
    return false;
  }
}

/**
 * Check if URL is a Twitter video thumbnail
 *
 * 2-layer validation:
 * 1. Hostname: pbs.twimg.com
 * 2. Path: /amplify_video_thumb/ or /ext_tw_video_thumb/ or /tweet_video_thumb/
 *
 * @param url - URL to validate
 * @returns Whether the URL is a video thumbnail URL
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

    // 1. Check hostname: pbs.twimg.com (thumbnail server)
    if (urlObj.hostname !== 'pbs.twimg.com') {
      return false;
    }

    // 2. Check path: video thumbnail pattern matching
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

/**
 * Extract video ID from thumbnail URL
 *
 * @param url - Video thumbnail URL
 * @returns Video ID (example: "1931629000243453952") or null
 */
export function extractVideoIdFromThumbnail(url: string): string | null {
  if (!isVideoThumbnailUrl(url)) {
    return null;
  }

  try {
    // Path example: /amplify_video_thumb/1931629000243453952/img/wzXQeHFbVbPENOya
    // Video ID is the second path segment
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);

    // Find amplify_video_thumb or ext_tw_video_thumb index
    const thumbIndex = pathSegments.findIndex(seg =>
      /^(amplify_video_thumb|ext_tw_video_thumb)$/i.test(seg)
    );

    if (thumbIndex === -1 || thumbIndex + 1 >= pathSegments.length) {
      return null;
    }

    const videoId = pathSegments[thumbIndex + 1];

    // Video ID should be numeric
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

/**
 * Validate if media URL is valid
 *
 * @param url - URL to validate
 * @returns Whether the URL is valid
 */
export function isValidMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // URL length limit (browser standard limit is 2048)
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
      // Only needed in test environment, fallback
      // Browser environment always has globalThis.URL or window.URL
      return isValidMediaUrlFallback(url);
    }

    if (!URLConstructor) {
      return isValidMediaUrlFallback(url);
    }

    const urlObj = new URLConstructor(url);

    // Validate protocol - only https or http allowed
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return false;
    }

    // Validate path per domain
    if (urlObj.hostname === 'pbs.twimg.com') {
      // pbs.twimg.com must include /media/ or video thumbnail path, exclude profile_images
      const path = urlObj.pathname;
      const isMedia = path.includes('/media/');
      const isVideoThumb =
        /\/ext_tw_video_thumb\//.test(path) ||
        /\/tweet_video_thumb\//.test(path) ||
        /\/video_thumb\//.test(path);
      return (isMedia || isVideoThumb) && !path.includes('/profile_images/');
    }

    if (urlObj.hostname === 'video.twimg.com') {
      // video.twimg.com allows all paths
      return true;
    }

    // Other domains not allowed (Twitter media only)
    return false;
  } catch (error) {
    // URL creation failed, use fallback
    logger.warn('URL parsing failed, using fallback:', error);
    return isValidMediaUrlFallback(url);
  }
}

/**
 * Fallback validation function when URL constructor is unavailable
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

  // Exact Twitter media domain check
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

  // Explicit rejection of unsupported domains
  return false;
}

/**
 * Check if original ('orig') version can be extracted from image URL
 *
 * Verifies that the URL is a Twitter media image URL supporting the 'orig' parameter.
 * Only pbs.twimg.com/media/ paths support original version extraction.
 *
 * @param url - URL to verify
 * @returns Whether original version can be extracted
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
  if (!url || typeof url !== 'string') {
    return false;
  }

  // No need to extract if already orig
  try {
    const urlObj = new URL(url);
    if (urlObj.searchParams.get('name') === 'orig') {
      logger.debug('canExtractOriginalImage: Already has orig parameter', { url });
      return false;
    }
  } catch {
    // Continue with fallback if URL parsing fails
  }

  // Only pbs.twimg.com/media/ path supports original extraction
  const isMediaImage = url.includes('pbs.twimg.com') && url.includes('/media/');

  if (isMediaImage) {
    logger.debug('canExtractOriginalImage: Original extraction possible', { url });
    return true;
  }

  logger.debug('canExtractOriginalImage: Original extraction not possible', {
    url,
    reason: isMediaImage ? 'already orig' : 'not a pbs.twimg.com/media URL',
  });
  return false;
}

/**
 * Video original URL optimization (Phase 330)
 *
 * Optimizes video quality from video.twimg.com URLs.
 * Twitter API analysis results:
 * - tag=12: MP4 format (highest quality, recommended)
 * - tag=13: WebM format (mobile optimized)
 * - none: Default (unstable)
 *
 * @param url - Video URL (example: https://video.twimg.com/vi/1234567890/pu.mp4?tag=12)
 * @returns Optimized URL (tag=12 guaranteed)
 *
 * @example
 * // ✅ Add tag parameter
 * extractOriginalVideoUrl('https://video.twimg.com/vi/1234567890/pu.mp4')
 * // → 'https://video.twimg.com/vi/1234567890/pu.mp4?tag=12'
 *
 * // ✅ Keep tag=12
 * extractOriginalVideoUrl('https://video.twimg.com/vi/1234567890/pu.mp4?tag=12')
 * // → 'https://video.twimg.com/vi/1234567890/pu.mp4?tag=12'
 *
 * // ✅ Change tag=13 → tag=12
 * extractOriginalVideoUrl('https://video.twimg.com/vi/1234567890/pu.mp4?tag=13')
 * // → 'https://video.twimg.com/vi/1234567890/pu.mp4?tag=12'
 */
export function extractOriginalVideoUrl(url: string): string {
  // Input validation
  if (!url || typeof url !== 'string') {
    logger.warn('extractOriginalVideoUrl: URL is empty or not a string', { url });
    return url || '';
  }

  try {
    // Handle tag parameter via URL parsing
    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;

    // If tag=12 already set, return as is
    if (searchParams.get('tag') === '12') {
      logger.debug('extractOriginalVideoUrl: Already has optimal tag=12', { url });
      return url;
    }

    // Set or change tag parameter (standardize to 12)
    searchParams.set('tag', '12');
    const optimizedUrl = urlObj.toString();

    logger.debug('extractOriginalVideoUrl: Video URL optimization successful', {
      original: url,
      optimized: optimizedUrl,
      changed: url !== optimizedUrl,
    });

    return optimizedUrl;
  } catch (error) {
    // Fallback if URL parsing fails: string-based processing
    logger.debug('extractOriginalVideoUrl: URL parsing failed, using fallback strategy', {
      url,
      error: (error as Error).message,
    });

    // Fallback: string-based processing
    if (url.includes('?')) {
      // If existing query parameters
      const [base, params] = url.split('?');
      const searchParams = new URLSearchParams(params);
      const previousTag = searchParams.get('tag');
      searchParams.set('tag', '12');
      const fallbackUrl = `${base}?${searchParams.toString()}`;

      logger.debug('extractOriginalVideoUrl: String-based tag parameter change', {
        original: url,
        fallback: fallbackUrl,
        previousTag,
      });

      return fallbackUrl;
    }
    // If no query parameters
    const fallbackUrl = `${url}?tag=12`;
    logger.debug('extractOriginalVideoUrl: String-based tag parameter addition', {
      original: url,
      fallback: fallbackUrl,
    });

    return fallbackUrl;
  }
}

/**
 * Pre-validate: whether video original optimization is possible (Phase 330)
 *
 * Checks if a video.twimg.com/vi/ format URL supports
 * optimization via tag parameter.
 *
 * @param url - URL to validate
 * @returns Whether optimization is possible
 *
 * @example
 * // ✅ Original optimization possible
 * canExtractOriginalVideo('https://video.twimg.com/vi/1234567890/pu.mp4')
 *
 * // ✅ Already optimized (still true - function name differs but optimization state)
 * canExtractOriginalVideo('https://video.twimg.com/vi/1234567890/pu.mp4?tag=12')
 *
 * // ❌ Optimization not possible (GIF)
 * canExtractOriginalVideo('https://pbs.twimg.com/media/ABC123/video.jpg')
 *
 * // ❌ Optimization not possible (Ad video)
 * canExtractOriginalVideo('https://amplifeed.twimg.com/...')
 */
export function canExtractOriginalVideo(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Only video.twimg.com/vi/ format supports tag parameter optimization
  const isVideoTwimgUrl = url.includes('video.twimg.com') && url.includes('/vi/');

  if (isVideoTwimgUrl) {
    logger.debug('canExtractOriginalVideo: Video optimization possible', { url });
    return true;
  }

  logger.debug('canExtractOriginalVideo: Video optimization not possible', {
    url,
    reason: !url.includes('video.twimg.com') ? 'not video.twimg.com' : 'not /vi/ path',
  });
  return false;
}

/**
 * Generate high-quality media version from URL
 *
 * @param url - Original URL
 * @param quality - Quality setting ('large' | 'medium' | 'small')
 * @returns High-quality URL
 */
export function getHighQualityMediaUrl(
  url: string,
  quality: 'large' | 'medium' | 'small' = 'large'
): string {
  // Input validation - handle null/undefined
  if (!url || typeof url !== 'string') {
    return url || '';
  }

  try {
    // Safely attempt URL constructor
    let URLConstructor: typeof URL | undefined;

    if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
      URLConstructor = globalThis.URL;
    } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
      URLConstructor = window.URL;
    }

    if (!URLConstructor) {
      return getHighQualityMediaUrlFallback(url, quality);
    }

    const urlObj = new URLConstructor(url);
    urlObj.searchParams.set('name', quality);
    if (!urlObj.searchParams.has('format')) {
      urlObj.searchParams.set('format', 'jpg');
    }
    return urlObj.toString();
  } catch {
    return getHighQualityMediaUrlFallback(url, quality);
  }
}

/**
 * Fallback quality conversion without URL constructor
 */
function getHighQualityMediaUrlFallback(
  url: string,
  quality: 'large' | 'medium' | 'small' = 'large'
): string {
  // Input validation
  if (!url || typeof url !== 'string') {
    return url;
  }

  // Basic URL validity check - must have protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }

  // Remove existing name parameter and replace with new quality
  const processedUrl = url.replace(/[?&]name=[^&]*/, '');

  // Parse query parameters
  const hasQuery = processedUrl.includes('?');
  const baseUrl = hasQuery ? processedUrl.split('?')[0] : processedUrl;
  const existingParams = hasQuery ? processedUrl.split('?')[1] : '';

  // Build new parameter array
  const params = [];

  // Add name parameter first (matches test expectations)
  params.push(`name=${quality}`);

  // Add existing parameters except name
  if (existingParams) {
    const existingParamPairs = existingParams
      .split('&')
      .filter(param => param && !param.startsWith('name='));
    params.push(...existingParamPairs);
  }

  // Add format parameter if not present
  if (!params.some(p => p.startsWith('format='))) {
    params.push('format=jpg');
  }

  return `${baseUrl}?${params.join('&')}`;
}

// ===== helpers to access services via container (no direct service imports in utils) =====
function getUsernameSafe(): string | null {
  // 우선 media 레이어 헬퍼 사용 (테스트에서 모킹 용이)
  try {
    const viaMedia = getPreferredUsername();
    if (viaMedia) return viaMedia;
  } catch {
    // noop
  }
  return null;
}

function getFilename(info: MediaInfo, options: FilenameOptions): string {
  try {
    const service = getMediaFilenameService();
    return service.generateMediaFilename(info, options);
  } catch {
    // minimal fallback: synthesize simple filename
    const base = info.tweetId ? `${info.tweetId}` : 'media';
    const idx = (options.index ?? 1).toString().padStart(2, '0');
    const ext = options.extension ? `.${options.extension}` : '';
    return `${base}_${idx}${ext}`;
  }
}

/**
 * Safely clean filename (remove duplicate extensions, handle special characters)
 *
 * @param filename - Original filename
 * @returns Cleaned filename
 */
export function cleanFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'media';
  }

  // Basic cleaning: trim, lowercase
  let cleaned = filename.trim();

  // If extension already exists, remove it (image/video extensions)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const allExtensions = [...imageExtensions, ...videoExtensions];

  for (const ext of allExtensions) {
    if (cleaned.toLowerCase().endsWith(ext)) {
      cleaned = cleaned.slice(0, -ext.length);
      break;
    }
  }

  // Return default if filename is empty
  if (!cleaned) {
    return 'media';
  }

  // Remove special characters (filesystem safety)
  cleaned = cleaned.replace(/[<>:"/\\|?*]/g, '_');

  // Length limit (255 is typical filesystem limit)
  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 200);
  }

  return cleaned;
}

/**
 * Extract media ID (supports video thumbnail URLs)
 * @param url - Media URL
 * @returns Extracted media ID or null
 */
export function extractMediaId(url: string): string | null {
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
 * @param url - Video thumbnail URL
 * @returns Original media URL or null
 */
export function generateOriginalUrl(url: string): string | null {
  const mediaId = extractMediaId(url);
  if (!mediaId) return null;

  const formatMatch = url.match(/[?&]format=([^&]+)/);
  const format = formatMatch?.[1] ?? 'jpg';

  return `https://pbs.twimg.com/media/${mediaId}?format=${format}&name=orig`;
}
