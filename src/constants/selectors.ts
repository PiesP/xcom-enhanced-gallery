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

export const VIDEO_PLAYER_CONTEXT_SELECTOR =
  `${VIDEO_PLAYER_SELECTOR},[data-testid="videoComponent"],[data-testid="videoPlayerControls"],[data-testid="videoPlayerOverlay"],[role="application"],[aria-label*="Video"]` as const;

export const STATUS_LINK_SELECTOR = 'a[href*="/status/"]' as const;

export const TWITTER_IMAGE_SELECTOR = 'img[src*="pbs.twimg.com"]' as const;
export const TWITTER_VIDEO_SELECTOR = 'video[src*="video.twimg.com"]' as const;
export const TWITTER_MEDIA_SELECTOR =
  'img[src*="pbs.twimg.com"], video[src*="video.twimg.com"]' as const;

export const GALLERY_OVERLAY_SELECTOR = GALLERY_SELECTORS.OVERLAY;
export const GALLERY_CONTAINER_SELECTOR = GALLERY_SELECTORS.CONTAINER;

/**
 * Stable DOM selectors with multiple fallback options
 * Arrays ordered by reliability (first = most stable)
 */
export const STABLE_TWEET_CONTAINERS_SELECTORS = [
  'article[data-testid="tweet"]',
  'article[role="article"]',
] as const;

export const STABLE_MEDIA_CONTAINERS_SELECTORS = [
  '[data-testid="tweetPhoto"]',
  '[data-testid="videoPlayer"]',
  '[aria-label*="Image"]',
] as const;

export const STABLE_VIDEO_CONTAINERS_SELECTORS = ['[data-testid="videoPlayer"]', 'video'] as const;

export const STABLE_IMAGE_CONTAINERS_SELECTORS = [
  '[data-testid="tweetPhoto"]',
  'img[src*="pbs.twimg.com"]',
] as const;

export const STABLE_MEDIA_LINKS_SELECTORS = [
  'a[href*="/status/"][href*="/photo/"]',
  'a[href*="/status/"][href*="/video/"]',
] as const;

export const STABLE_MEDIA_VIEWERS_SELECTORS = [
  '[data-testid="photoViewer"]',
  '[aria-modal="true"][data-testid="Drawer"]',
  '[aria-roledescription="carousel"]',
] as const;

export const STABLE_MEDIA_PLAYERS_SELECTORS = ['[data-testid="videoPlayer"]', 'video'] as const;

const warnedInvalidSelectors: Record<string, true> = Object.create(null);

function warnInvalidSelectorOnce(selector: string, error: unknown): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  if (warnedInvalidSelectors[selector]) {
    return;
  }

  warnedInvalidSelectors[selector] = true;
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
