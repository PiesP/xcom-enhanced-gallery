/**
 * @fileoverview DOM selector constants
 * @description Provides multiple fallback selectors for X.com DOM elements.
 * Primary selectors use data-testid, with aria-* and structural fallbacks.
 */

import { CSS } from '@constants/css';
import { logger } from '@shared/logging';

const GALLERY_SELECTORS = CSS.SELECTORS;

/**
 * Primary DOM selectors (data-testid based)
 * These are stable across X.com updates
 */
export const SELECTORS = {
  // Tweet containers
  TWEET: 'article[data-testid="tweet"]',
  /** Tweet article with fallback to generic article */
  TWEET_ARTICLE: '[data-testid="tweet"], article',

  // Media elements
  TWEET_PHOTO: '[data-testid="tweetPhoto"]',
  TWEET_TEXT: '[data-testid="tweetText"]',
  VIDEO_PLAYER: '[data-testid="videoPlayer"]',

  // Links and URLs
  /** Status link for tweet ID extraction */
  STATUS_LINK: 'a[href*="/status/"]',

  // Media source detection
  /** Twitter image source pattern */
  TWITTER_IMAGE: 'img[src*="pbs.twimg.com"]',
  /** Twitter video source pattern */
  TWITTER_VIDEO: 'video[src*="video.twimg.com"]',
  /** Combined media source selector for extraction */
  TWITTER_MEDIA: 'img[src*="pbs.twimg.com"], video[src*="video.twimg.com"]',

  // Gallery elements
  GALLERY_OVERLAY: GALLERY_SELECTORS.OVERLAY,
  GALLERY_CONTAINER: GALLERY_SELECTORS.CONTAINER,
} as const;

/**
 * Fallback selectors using aria-* and structural patterns
 * Used when data-testid selectors fail (e.g., X.com updates or A/B tests)
 */
export const FALLBACK_SELECTORS = {
  /** Tweet article fallbacks using aria-label patterns */
  TWEET: [
    'article[role="article"]',
    'article[aria-labelledby]',
    '[data-testid="cellInnerDiv"] > div > article',
  ],
  /** Tweet photo fallbacks using aria and img patterns */
  TWEET_PHOTO: [
    '[aria-label*="Image"]',
    '[role="img"][aria-label]',
    'a[href*="/photo/"] img',
    'div[aria-label] img[src*="pbs.twimg.com"]',
  ],
  /** Tweet text fallbacks */
  TWEET_TEXT: ['[lang][dir="auto"]', 'div[data-testid="tweetText"]', 'article [lang]'],
  /** Video player fallbacks */
  VIDEO_PLAYER: [
    '[aria-label*="Video"]',
    '[role="application"] video',
    'div[data-testid="videoComponent"]',
    'video[src*="video.twimg.com"]',
  ],
  /** Modal/overlay fallbacks */
  MODAL: ['[aria-modal="true"]', '[role="dialog"]', '[aria-label*="Close"]'],
  /** Media viewer fallbacks */
  MEDIA_VIEWER: [
    '[aria-roledescription="carousel"]',
    '[aria-label*="Gallery"]',
    '[role="dialog"][aria-modal="true"]',
  ],
} as const;

/**
 * Stable DOM selectors with multiple fallback options
 * Arrays ordered by reliability (first = most stable)
 */
export const STABLE_SELECTORS = {
  /** Tweet container selectors */
  TWEET_CONTAINERS: [
    'article[data-testid="tweet"]',
    'article[role="article"]',
    '[data-testid="cellInnerDiv"] article',
  ],
  /** Media container selectors */
  MEDIA_CONTAINERS: [
    '[data-testid="tweetPhoto"]',
    '[data-testid="videoPlayer"]',
    '[aria-label*="Image"]',
    '[aria-label*="Video"]',
    'a[href*="/photo/"] > div',
  ],
  /** Video container selectors */
  VIDEO_CONTAINERS: [
    '[data-testid="videoPlayer"]',
    'video',
    '[aria-label*="Video"]',
    '[data-testid="videoComponent"]',
  ],
  /** Image container selectors */
  IMAGE_CONTAINERS: [
    '[data-testid="tweetPhoto"]',
    'img[src*="pbs.twimg.com"]',
    '[aria-label*="Image"] img',
    'a[href*="/photo/"] img',
  ],
  /** Media link selectors */
  MEDIA_LINKS: [
    'a[href*="/status/"][href*="/photo/"]',
    'a[href*="/status/"][href*="/video/"]',
    'a[href*="/photo/"][aria-label]',
    'a[href*="/video/"][aria-label]',
  ],
  /** Media viewer modal selectors */
  MEDIA_VIEWERS: [
    '[data-testid="photoViewer"]',
    '[aria-modal="true"][data-testid="Drawer"]',
    '[aria-roledescription="carousel"]',
    '[role="dialog"][aria-modal="true"]',
    '[aria-label*="Gallery"]',
  ],
  /** Media player selectors */
  MEDIA_PLAYERS: ['[data-testid="videoPlayer"]', 'video', '[role="application"] video'],
  /** Tweet action button selectors */
  ACTION_BUTTONS: {
    like: '[data-testid="like"]',
    retweet: '[data-testid="retweet"]',
    reply: '[data-testid="reply"]',
    share: '[data-testid="share"]',
    bookmark: '[data-testid="bookmark"]',
  },
  /** Quoted tweet selectors */
  QUOTED_TWEET_ARTICLE: 'article[data-testid="tweet"] article[data-testid="tweet"]',
  /** Quote tweet fallback */
  QUOTED_TWEET_FALLBACK: [
    'article[role="article"] article[role="article"]',
    '[data-testid="quoteTweet"]',
  ],
} as const;

const warnedInvalidSelectors = new Set<string>();

function warnInvalidSelectorOnce(selector: string, error: unknown): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  if (warnedInvalidSelectors.has(selector)) {
    return;
  }

  warnedInvalidSelectors.add(selector);
  logger.warn(`[selectors] Invalid selector skipped: ${selector}`, { error });
}

/**
 * Query DOM with fallback selectors
 * Tries primary selector first, then fallbacks in order
 *
 * @param container - Parent element to search within
 * @param primarySelector - Primary selector to try first
 * @param fallbacks - Array of fallback selectors
 * @returns Found element or null
 */
export function queryWithFallback(
  container: Element | Document,
  primarySelector: string,
  fallbacks: readonly string[] = []
): Element | null {
  // Try primary selector first
  try {
    const primary = container.querySelector(primarySelector);
    if (primary) return primary;
  } catch (error) {
    warnInvalidSelectorOnce(primarySelector, error);
  }

  // Try fallbacks in order
  for (const fallback of fallbacks) {
    try {
      const element = container.querySelector(fallback);
      if (element) return element;
    } catch (error) {
      warnInvalidSelectorOnce(fallback, error);
    }
  }

  return null;
}

/**
 * Query all elements with fallback selectors
 * Combines results from all matching selectors
 *
 * @param container - Parent element to search within
 * @param selectors - Array of selectors to try
 * @returns Array of unique matching elements
 */
export function queryAllWithFallback(
  container: Element | Document,
  selectors: readonly string[]
): Element[] {
  const seen = new WeakSet<Element>();
  const results: Element[] = [];

  for (const selector of selectors) {
    try {
      const elements = container.querySelectorAll(selector);
      for (const element of elements) {
        if (!seen.has(element)) {
          seen.add(element);
          results.push(element);
        }
      }
    } catch (error) {
      warnInvalidSelectorOnce(selector, error);
    }
  }

  return results;
}
