/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Image URL Transformer
 *
 * Phase 351.5: Transformation Layer - Image URL transformation
 */

import { logger } from '../../../logging';
import { URL_PATTERNS } from '../../patterns/url-patterns';

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
  if (!url || typeof url !== 'string') {
    logger.warn('extractOriginalImageUrl: URL is empty or not a string', { url });
    return url;
  }

  try {
    const urlObj = new URL(url);

    // Check current name parameter
    const currentName = urlObj.searchParams.get('name');

    // If already set to orig, return as-is
    if (currentName === 'orig') {
      logger.debug('extractOriginalImageUrl: orig parameter already set', { url });
      return url;
    }

    // Set name parameter to orig
    urlObj.searchParams.set('name', 'orig');
    const result = urlObj.toString();

    logger.debug('extractOriginalImageUrl: successfully extracted original URL', {
      originalUrl: url,
      extractedUrl: result,
      previousName: currentName,
    });

    return result;
  } catch (error) {
    // URL parsing failed - apply fallback strategy
    logger.debug('extractOriginalImageUrl: URL parsing failed, applying fallback', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });

    // If name parameter exists, replace it with orig
    if (url.includes('?')) {
      const result = `${url.replace(/[?&]name=[^&]*/, '')}&name=orig`;
      logger.debug('extractOriginalImageUrl: string-based extraction (replace existing name)', {
        result,
      });
      return result;
    }

    // If no name parameter, add it
    const result = `${url}?name=orig`;
    logger.debug('extractOriginalImageUrl: string-based extraction (add new name parameter)', {
      result,
    });
    return result;
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
  if (!url || typeof url !== 'string') {
    return false;
  }

  // If already orig, no extraction needed
  try {
    const urlObj = new URL(url);
    if (urlObj.searchParams.get('name') === 'orig') {
      logger.debug('canExtractOriginalImage: orig parameter already set', { url });
      return false;
    }
  } catch {
    // URL parsing failed - continue with fallback
  }

  // Only pbs.twimg.com/media/ paths support original extraction
  const isMediaImage = url.includes('pbs.twimg.com') && url.includes('/media/');

  if (isMediaImage) {
    logger.debug('canExtractOriginalImage: original extraction possible', { url });
    return true;
  }

  logger.debug('canExtractOriginalImage: original extraction not possible', {
    url,
    reason: isMediaImage ? 'already orig' : 'not a pbs.twimg.com/media URL',
  });
  return false;
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

  const formatMatch = url.match(/[?&]format=([^&]+)/);
  const format = formatMatch?.[1] ?? 'jpg';

  return `https://pbs.twimg.com/media/${mediaId}?format=${format}&name=orig`;
}
