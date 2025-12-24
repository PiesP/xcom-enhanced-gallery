/**
 * @fileoverview DOM selector constants
 * @description Provides multiple fallback selectors for X.com DOM elements.
 * Primary selectors use data-testid, with aria-* and structural fallbacks.
 */

import { CSS } from '@constants/css';
import { queryAllWithFallback as queryAllWithFallbackImpl } from '@shared/utils/dom/query-helpers';

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
export const TWITTER_MEDIA_SELECTOR =
  'img[src*="pbs.twimg.com"], video[src*="video.twimg.com"]' as const;

export const GALLERY_OVERLAY_SELECTOR = GALLERY_SELECTORS.OVERLAY;

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

export const STABLE_MEDIA_VIEWERS_SELECTORS = [
  '[data-testid="photoViewer"]',
  '[aria-modal="true"][data-testid="Drawer"]',
  '[aria-roledescription="carousel"]',
] as const;

/**
 * Query all elements with fallback selectors
 * Combines results from all matching selectors
 *
 * @deprecated Use queryAllWithFallback from @shared/utils/dom/query-helpers instead
 * @param container - Parent element to search within
 * @param selectors - Array of selectors to try
 * @returns Array of unique matching elements
 */
export const queryAllWithFallback = queryAllWithFallbackImpl;
