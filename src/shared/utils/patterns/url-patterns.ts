/**
 * URL Pattern Utilities for X.com Gallery
 *
 * Centralized URL pattern matching and extraction logic.
 * Phase 129 optimized: removed unused methods to reduce bundle size.
 */

import { logger } from '@shared/logging';

/**
 * Utility object for URL pattern matching and extraction
 * Phase 129: Only maintained methods that are actually used
 */
export const URLPatterns = {
  /**
   * Tweet URL regular expression pattern
   * Supports both Twitter.com and x.com domains
   */
  TWEET_URL_PATTERN:
    /https?:\/\/(?:(?:mobile\.|www\.)?twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/,

  /**
   * Extract tweet ID from a URL
   *
   * @param url - Tweet URL to extract from
   * @returns Tweet ID string or null if extraction fails
   */
  extractTweetId(url: string): string | null {
    try {
      if (!url || typeof url !== 'string') {
        return null;
      }

      const match = url.match(this.TWEET_URL_PATTERN);
      if (!match) {
        return null;
      }

      const [, , tweetId] = match;
      return tweetId || null;
    } catch (error) {
      logger.error('Failed to extract tweet ID:', error);
      return null;
    }
  },
};

/**
 * Backward compatibility export
 */
export const TWEET_URL_PATTERN = URLPatterns.TWEET_URL_PATTERN;

/**
 * URL patterns (public API) — compatible with constants.ts API
 *
 * NOTE:
 *  - Maintains key names and regex forms expected by legacy consumers in the project.
 *  - Single source of truth: this object is the only source of regex definitions.
 *  - constants.ts imports and re-exports from this object.
 */
export const URL_PATTERNS = Object.freeze({
  /** Media URL pattern matching pbs.twimg.com resources */
  MEDIA:
    /^https:\/\/pbs\.twimg\.com\/(?:media\/[\w-]+\?format=(?:jpg|jpeg|png|webp)&name=(?:[a-z]+|\d{2,4}x\d{2,4})|(?:ext_tw_video_thumb|video_thumb)\/\d+(?:\/pu)?\/img\/[\w-]+(?:\?.*)?|tweet_video_thumb\/[\w-]+(?:\?.*)?)/,

  /** Gallery media pattern for high-quality resources */
  GALLERY_MEDIA:
    /^https:\/\/pbs\.twimg\.com\/(?:media\/[\w-]+\?format=(?:jpg|jpeg|png|webp)&name=orig|(?:ext_tw_video_thumb|video_thumb)\/\d+(?:\/pu)?\/img\/[\w-]+(?:\?.*)?|tweet_video_thumb\/[\w-]+(?:\?.*)?)/,

  /** Extract media ID from URL */
  MEDIA_ID: /\/media\/([\w-]+)\?/,

  /** Extract video thumbnail ID (ext_tw_video_thumb|video_thumb|tweet_video_thumb) */
  VIDEO_THUMB_ID:
    /\/(?:(?:ext_tw_video_thumb|video_thumb)\/\d+(?:\/pu)?\/img\/([\w-]+)(?:\.[a-z0-9]+)?|tweet_video_thumb\/([\w-]+)(?:\.[a-z0-9]+)?)(?=[?/]|$)/,

  /** Extract tweet ID (compatible with constants.ts) - enhanced security with regex anchors */
  TWEET_ID: /^https?:\/\/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/,
} as const) as {
  MEDIA: RegExp;
  GALLERY_MEDIA: RegExp;
  MEDIA_ID: RegExp;
  VIDEO_THUMB_ID: RegExp;
  TWEET_ID: RegExp;
};
