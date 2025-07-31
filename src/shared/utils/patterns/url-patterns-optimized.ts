/**
 * URL Pattern Utilities for X.com Gallery - Optimized Version
 * Reduced from 813 lines to ~150 lines with core functionality preserved
 */

import { logger } from '@shared/logging/logger';
import { safeParseInt } from '@shared/utils/type-safety-helpers';

/**
 * Core URL patterns (reduced from 123 patterns to ~8 essential patterns)
 */
export const URLPatterns = {
  // Combined Twitter/X.com pattern
  TWEET_URL: /https?:\/\/(?:(?:mobile\.|www\.)?twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/,
  MEDIA_PAGE: /https?:\/\/(?:(?:mobile\.|www\.)?twitter\.com|x\.com)\/([^/]+)\/media/,
  TWEET_PHOTO:
    /https?:\/\/(?:(?:mobile\.|www\.)?twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)\/photo\/(\d+)/,

  // Simplified domain checks
  X_DOMAIN: /^https?:\/\/x\.com/,
  TWITTER_DOMAIN: /^https?:\/\/(?:mobile\.|www\.)?twitter\.com/,

  // Media type patterns
  IMAGE: /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i,
  VIDEO: /\.(mp4|webm|mov)(\?.*)?$/i,
  TWITTER_MEDIA: /(?:pbs\.twimg\.com\/media|video\.twimg\.com)/i,

  /**
   * Check if URL is X.com or Twitter.com
   */
  isTwitterPlatform(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    return this.X_DOMAIN.test(url) || this.TWITTER_DOMAIN.test(url);
  },

  /**
   * Extract tweet ID from URL
   */
  extractTweetId(url: string): string | null {
    if (!url) return null;
    const match = url.match(this.TWEET_URL);
    return match ? match[2] || null : null;
  },

  /**
   * Extract username from URL
   */
  extractUsername(url: string): string | null {
    if (!url) return null;

    // Try tweet URL first
    let match = url.match(this.TWEET_URL);
    if (match && match[1] !== 'i') return match[1] || null;

    // Try photo URL
    match = url.match(this.TWEET_PHOTO);
    if (match && match[1] !== 'i') return match[1] || null;

    // Try media page
    match = url.match(this.MEDIA_PAGE);
    if (match && match[1] !== 'i') return match[1] || null;

    return null;
  },

  /**
   * Extract photo info from tweet photo URL
   */
  extractTweetPhotoInfo(url: string): {
    username: string;
    tweetId: string;
    photoIndex: number;
    photoUrl: string;
  } | null {
    if (!url) return null;

    const match = url.match(this.TWEET_PHOTO);
    if (!match) return null;

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
    if (!url) return false;
    return this.IMAGE.test(url) || this.VIDEO.test(url) || this.TWITTER_MEDIA.test(url);
  },
};

/**
 * Extract potential tweet URLs from page
 * Simplified version with essential functionality only
 */
export function extractTweetUrlsFromPage(): string[] {
  const urlCandidates: string[] = [];

  try {
    // Get URLs from links
    const links = document.querySelectorAll('a[href*="/status/"]');
    links.forEach(link => {
      const href = (link as HTMLAnchorElement).href;
      if (href && URLPatterns.isTwitterPlatform(href) && !isInvalidStatusUrl(href)) {
        urlCandidates.push(href);
      }
    });

    // Add current page URL if valid
    if (window.location.href.includes('/status/') && !isInvalidStatusUrl(window.location.href)) {
      urlCandidates.push(window.location.href);
    }
  } catch (error) {
    logger.debug('Failed to extract URLs:', error);
  }

  return [...new Set(urlCandidates)];
}

/**
 * Check if URL is invalid status URL
 */
export function isInvalidStatusUrl(url: string): boolean {
  if (!url) return true;

  const invalidPrefixes = [
    '/home/',
    '/search/',
    '/explore/',
    '/notifications/',
    '/messages/',
    '/i/',
    '/settings/',
  ];
  return invalidPrefixes.some(prefix => url.includes(`${prefix}status/`));
}

/**
 * Clean URL by removing HTML entities and quotes
 */
export function cleanUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    return url
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/^["']|["']$/g, '')
      .trim();
  } catch (error) {
    logger.debug('Failed to clean URL:', error);
    return null;
  }
}

/**
 * Enhanced URL detection for various Twitter/X.com patterns
 * Consolidated version of the original complex detection logic
 */
export function detectTwitterUrl(element?: Element): string | null {
  if (!element) return null;

  try {
    // Check href attribute
    if (element instanceof HTMLAnchorElement && element.href) {
      const href = cleanUrl(element.href);
      if (href && URLPatterns.isTwitterPlatform(href)) {
        return href;
      }
    }

    // Check data attributes
    const dataUrl = element.getAttribute('data-testid') || element.getAttribute('data-href');
    if (dataUrl) {
      const cleaned = cleanUrl(dataUrl);
      if (cleaned && URLPatterns.isTwitterPlatform(cleaned)) {
        return cleaned;
      }
    }

    // Check parent elements
    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 3) {
      if (parent instanceof HTMLAnchorElement && parent.href) {
        const href = cleanUrl(parent.href);
        if (href && URLPatterns.isTwitterPlatform(href)) {
          return href;
        }
      }
      parent = parent.parentElement;
      depth++;
    }

    return null;
  } catch (error) {
    logger.debug('Failed to detect Twitter URL:', error);
    return null;
  }
}

// Legacy compatibility exports
export const TWEET_URL_PATTERN = URLPatterns.TWEET_URL;
export const MEDIA_PAGE_PATTERN = URLPatterns.MEDIA_PAGE;
export const TWEET_PHOTO_URL_PATTERN = URLPatterns.TWEET_PHOTO;
export const XCOM_URL_PATTERN = URLPatterns.X_DOMAIN;
export const TWITTER_URL_PATTERN = URLPatterns.TWITTER_DOMAIN;
export const IMAGE_URL_PATTERN = URLPatterns.IMAGE;
export const VIDEO_URL_PATTERN = URLPatterns.VIDEO;
export const TWITTER_IMAGE_PATTERN = URLPatterns.TWITTER_MEDIA;
