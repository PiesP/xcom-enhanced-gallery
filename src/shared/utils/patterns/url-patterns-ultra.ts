/**
 * URL Pattern Utilities for X.com Gallery - Ultra-Optimized Version
 * Minimal patterns with maximum functionality
 */

import { logger } from '@shared/logging/logger';
import { safeParseInt } from '@shared/utils/type-safety-helpers';

/**
 * Essential URL patterns only - reduced to absolute minimum
 */
export const URLPatterns = {
  // Single comprehensive pattern for all Twitter/X.com URLs
  TWEET_URL:
    /https?:\/\/(?:(?:mobile\.|www\.)?twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)(?:\/photo\/(\d+))?/,
  MEDIA_PAGE: /https?:\/\/(?:(?:mobile\.|www\.)?twitter\.com|x\.com)\/([^/]+)\/media/,

  // Simple domain check
  PLATFORM: /^https?:\/\/(?:(?:mobile\.|www\.)?twitter\.com|x\.com)/,

  // Media patterns
  IMAGE: /\.(jpg|jpeg|png|gif|webp)/i,
  VIDEO: /\.(mp4|webm|mov)/i,
  TWITTER_MEDIA: /(?:pbs\.twimg\.com|video\.twimg\.com)/i,

  /**
   * Check if URL is Twitter platform (X.com or Twitter.com)
   */
  isTwitterPlatform(url: string): boolean {
    return Boolean(url && this.PLATFORM.test(url));
  },

  /**
   * Extract tweet ID from URL
   */
  extractTweetId(url: string): string | null {
    if (!url) return null;
    const match = url.match(this.TWEET_URL);
    return match?.[2] || null;
  },

  /**
   * Extract username from URL
   */
  extractUsername(url: string): string | null {
    if (!url) return null;
    const match = url.match(this.TWEET_URL) || url.match(this.MEDIA_PAGE);
    return match?.[1] !== 'i' ? match?.[1] || null : null;
  },

  /**
   * Extract photo info from tweet URL
   */
  extractTweetPhotoInfo(url: string): {
    username: string;
    tweetId: string;
    photoIndex: number;
    photoUrl: string;
  } | null {
    if (!url) return null;

    const match = url.match(this.TWEET_URL);
    if (!match?.[3]) return null; // No photo index

    const [fullMatch, username, tweetId, photoIndexStr] = match;
    const photoIndex = safeParseInt(photoIndexStr, 10);

    if (!username || !tweetId || username === 'i' || isNaN(photoIndex)) {
      return null;
    }

    return { username, tweetId, photoIndex, photoUrl: fullMatch };
  },

  /**
   * Check if URL is a valid media URL
   */
  isValidMediaUrl(url: string): boolean {
    return Boolean(
      url && (this.IMAGE.test(url) || this.VIDEO.test(url) || this.TWITTER_MEDIA.test(url))
    );
  },
};

/**
 * Extract potential tweet URLs from page - minimal implementation
 */
export function extractTweetUrlsFromPage(): string[] {
  try {
    const urls = new Set<string>();

    // Get URLs from links
    document.querySelectorAll('a[href*="/status/"]').forEach(link => {
      const href = (link as HTMLAnchorElement).href;
      if (URLPatterns.isTwitterPlatform(href) && !href.includes('/i/status/')) {
        urls.add(href);
      }
    });

    // Add current URL if valid
    if (window.location.href.includes('/status/') && !window.location.href.includes('/i/status/')) {
      urls.add(window.location.href);
    }

    return Array.from(urls);
  } catch (error) {
    logger.debug('Failed to extract URLs:', error);
    return [];
  }
}

/**
 * Check if URL is invalid status URL
 */
export function isInvalidStatusUrl(url: string): boolean {
  return !url || url.includes('/i/status/');
}

/**
 * Clean URL by removing HTML entities
 */
export function cleanUrl(url: string): string | null {
  if (!url) return null;

  try {
    return url
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  } catch {
    return null;
  }
}

/**
 * Enhanced URL detection - simplified version
 */
export function detectTwitterUrl(element?: Element): string | null {
  if (!element) return null;

  try {
    // Check href
    if (element instanceof HTMLAnchorElement && element.href) {
      const href = cleanUrl(element.href);
      if (href && URLPatterns.isTwitterPlatform(href)) {
        return href;
      }
    }

    // Check parent
    const parent = element.parentElement;
    if (parent instanceof HTMLAnchorElement && parent.href) {
      const href = cleanUrl(parent.href);
      if (href && URLPatterns.isTwitterPlatform(href)) {
        return href;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Legacy compatibility exports with original names
export const TWEET_URL_PATTERN = URLPatterns.TWEET_URL;
export const MEDIA_PAGE_PATTERN = URLPatterns.MEDIA_PAGE;
export const TWEET_PHOTO_URL_PATTERN = URLPatterns.TWEET_URL; // Same pattern
export const XCOM_URL_PATTERN = URLPatterns.PLATFORM;
export const TWITTER_URL_PATTERN = URLPatterns.PLATFORM;
export const IMAGE_URL_PATTERN = URLPatterns.IMAGE;
export const VIDEO_URL_PATTERN = URLPatterns.VIDEO;
export const TWITTER_IMAGE_PATTERN = URLPatterns.TWITTER_MEDIA;
