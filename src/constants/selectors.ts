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
// NOTE:
// These are exported as individual constants to improve tree-shaking.
// Importing a single selector should not force shipping the entire selector table.

export const TWEET_SELECTOR = 'article[data-testid="tweet"]' as const;
export const TWEET_ARTICLE_SELECTOR = '[data-testid="tweet"], article' as const;

export const TWEET_PHOTO_SELECTOR = '[data-testid="tweetPhoto"]' as const;
export const TWEET_TEXT_SELECTOR = '[data-testid="tweetText"]' as const;
export const VIDEO_PLAYER_SELECTOR = '[data-testid="videoPlayer"]' as const;

export const STATUS_LINK_SELECTOR = 'a[href*="/status/"]' as const;

export const TWITTER_IMAGE_SELECTOR = 'img[src*="pbs.twimg.com"]' as const;
export const TWITTER_VIDEO_SELECTOR = 'video[src*="video.twimg.com"]' as const;
export const TWITTER_MEDIA_SELECTOR =
  'img[src*="pbs.twimg.com"], video[src*="video.twimg.com"]' as const;

export const GALLERY_OVERLAY_SELECTOR = GALLERY_SELECTORS.OVERLAY;
export const GALLERY_CONTAINER_SELECTOR = GALLERY_SELECTORS.CONTAINER;

/**
 * @deprecated Prefer importing individual selector constants.
 */
export const SELECTORS = {
  TWEET: TWEET_SELECTOR,
  TWEET_ARTICLE: TWEET_ARTICLE_SELECTOR,
  TWEET_PHOTO: TWEET_PHOTO_SELECTOR,
  TWEET_TEXT: TWEET_TEXT_SELECTOR,
  VIDEO_PLAYER: VIDEO_PLAYER_SELECTOR,
  STATUS_LINK: STATUS_LINK_SELECTOR,
  TWITTER_IMAGE: TWITTER_IMAGE_SELECTOR,
  TWITTER_VIDEO: TWITTER_VIDEO_SELECTOR,
  TWITTER_MEDIA: TWITTER_MEDIA_SELECTOR,
  GALLERY_OVERLAY: GALLERY_OVERLAY_SELECTOR,
  GALLERY_CONTAINER: GALLERY_CONTAINER_SELECTOR,
} as const;

/**
 * Fallback selectors using aria-* and structural patterns
 * Used when data-testid selectors fail (e.g., X.com updates or A/B tests)
 */
/**
 * @deprecated Prefer passing explicit fallback arrays to queryWithFallback/queryAllWithFallback.
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
export const STABLE_TWEET_CONTAINERS_SELECTORS = [
  'article[data-testid="tweet"]',
  'article[role="article"]',
  '[data-testid="cellInnerDiv"] article',
] as const;

export const STABLE_MEDIA_CONTAINERS_SELECTORS = [
  '[data-testid="tweetPhoto"]',
  '[data-testid="videoPlayer"]',
  '[aria-label*="Image"]',
  '[aria-label*="Video"]',
  'a[href*="/photo/"] > div',
] as const;

export const STABLE_VIDEO_CONTAINERS_SELECTORS = [
  '[data-testid="videoPlayer"]',
  'video',
  '[aria-label*="Video"]',
  '[data-testid="videoComponent"]',
] as const;

export const STABLE_IMAGE_CONTAINERS_SELECTORS = [
  '[data-testid="tweetPhoto"]',
  'img[src*="pbs.twimg.com"]',
  '[aria-label*="Image"] img',
  'a[href*="/photo/"] img',
] as const;

export const STABLE_MEDIA_LINKS_SELECTORS = [
  'a[href*="/status/"][href*="/photo/"]',
  'a[href*="/status/"][href*="/video/"]',
  'a[href*="/photo/"][aria-label]',
  'a[href*="/video/"][aria-label]',
] as const;

export const STABLE_MEDIA_VIEWERS_SELECTORS = [
  '[data-testid="photoViewer"]',
  '[aria-modal="true"][data-testid="Drawer"]',
  '[aria-roledescription="carousel"]',
  '[role="dialog"][aria-modal="true"]',
  '[aria-label*="Gallery"]',
] as const;

export const STABLE_MEDIA_PLAYERS_SELECTORS = [
  '[data-testid="videoPlayer"]',
  'video',
  '[role="application"] video',
] as const;

/**
 * @deprecated Prefer importing the individual STABLE_*_SELECTORS exports.
 */
export const STABLE_SELECTORS = {
  /** Tweet container selectors */
  TWEET_CONTAINERS: STABLE_TWEET_CONTAINERS_SELECTORS,
  /** Media container selectors */
  MEDIA_CONTAINERS: STABLE_MEDIA_CONTAINERS_SELECTORS,
  /** Video container selectors */
  VIDEO_CONTAINERS: STABLE_VIDEO_CONTAINERS_SELECTORS,
  /** Image container selectors */
  IMAGE_CONTAINERS: STABLE_IMAGE_CONTAINERS_SELECTORS,
  /** Media link selectors */
  MEDIA_LINKS: STABLE_MEDIA_LINKS_SELECTORS,
  /** Media viewer modal selectors */
  MEDIA_VIEWERS: STABLE_MEDIA_VIEWERS_SELECTORS,
  /** Media player selectors */
  MEDIA_PLAYERS: STABLE_MEDIA_PLAYERS_SELECTORS,
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
