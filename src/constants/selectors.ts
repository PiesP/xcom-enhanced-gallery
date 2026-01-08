/**
 * @fileoverview DOM selector constants for X.com elements.
 *
 * Primary selectors use data-testid attributes (most stable),
 * with aria-* and structural fallbacks.
 *
 * @remarks
 * Each selector is exported individually for optimal tree-shaking.
 * STABLE_*_SELECTORS arrays provide fallback options ordered by reliability.
 *
 * @module constants/selectors
 */

import { CSS } from '@constants/css';

const GALLERY_SELECTORS = CSS.SELECTORS;

// ============================================================================
// Primary Selectors (data-testid based)
// ============================================================================

/**
 * Tweet article container selector
 *
 * Matches individual tweet articles in timeline or thread views.
 */
export const TWEET_SELECTOR = 'article[data-testid="tweet"]' as const;

/**
 * Tweet article selector with fallback
 *
 * Fallback to generic `article` when data-testid unavailable.
 */
export const TWEET_ARTICLE_SELECTOR = '[data-testid="tweet"], article' as const;

/**
 * Tweet photo container selector
 *
 * Matches photo containers within tweets.
 */
export const TWEET_PHOTO_SELECTOR = '[data-testid="tweetPhoto"]' as const;

/**
 * Tweet text content selector
 *
 * Matches main text content area of a tweet.
 */
export const TWEET_TEXT_SELECTOR = '[data-testid="tweetText"]' as const;

/**
 * Video player container selector
 *
 * @remarks
 * Matches video player elements within tweets.
 *
 * @example
 * ```typescript
 * const videoPlayers = document.querySelectorAll(VIDEO_PLAYER_SELECTOR);
 * ```
 */
export const VIDEO_PLAYER_SELECTOR = '[data-testid="videoPlayer"]' as const;

/**
 * Extended video player context selector with multiple fallbacks
 *
 * @remarks
 * Comprehensive selector for video-related elements including player controls,
 * overlays, and ARIA-labeled video components. Use when broad video context matching is needed.
 *
 * @example
 * ```typescript
 * const videoContext = element.closest(VIDEO_PLAYER_CONTEXT_SELECTOR);
 * ```
 */
export const VIDEO_PLAYER_CONTEXT_SELECTOR =
  `${VIDEO_PLAYER_SELECTOR},[data-testid="videoComponent"],[data-testid="videoPlayerControls"],[data-testid="videoPlayerOverlay"],[role="application"],[aria-label*="Video"]` as const;

/**
 * Status link selector (tweet permalink)
 *
 * @remarks
 * Matches links to specific tweet status pages (format: /username/status/id).
 * Used for extracting tweet IDs and navigating to permalinks.
 *
 * @example
 * ```typescript
 * const statusLinks = document.querySelectorAll(STATUS_LINK_SELECTOR);
 * const tweetId = statusLinks[0]?.href.match(/status\/(\d+)/)?.[1];
 * ```
 */
export const STATUS_LINK_SELECTOR = 'a[href*="/status/"]' as const;

/**
 * Twitter media CDN selector
 *
 * @remarks
 * Matches images and videos served from Twitter's CDN domains.
 * Useful for identifying Twitter-hosted media content.
 *
 * @example
 * ```typescript
 * const twitterMedia = document.querySelectorAll(TWITTER_MEDIA_SELECTOR);
 * ```
 */
export const TWITTER_MEDIA_SELECTOR =
  'img[src*="pbs.twimg.com"], video[src*="video.twimg.com"]' as const;

/**
 * Gallery overlay selector
 *
 * @remarks
 * References the gallery overlay selector from CSS constants.
 * Used for identifying the application's own gallery overlay element.
 *
 * @see {@link CSS.SELECTORS.OVERLAY}
 */
export const GALLERY_OVERLAY_SELECTOR = GALLERY_SELECTORS.OVERLAY;

// ============================================================================
// Stable Selectors with Fallbacks
// ============================================================================

/**
 * Stable tweet container selectors with fallback chain
 *
 * @remarks
 * Ordered by reliability:
 * 1. `data-testid="tweet"` - Most stable, Twitter's official test identifier
 * 2. `role="article"` - Semantic fallback for article elements
 *
 * @example
 * ```typescript
 * function findTweetContainer(element: Element): Element | null {
 *   for (const selector of STABLE_TWEET_CONTAINERS_SELECTORS) {
 *     const container = element.closest(selector);
 *     if (container) return container;
 *   }
 *   return null;
 * }
 * ```
 */
export const STABLE_TWEET_CONTAINERS_SELECTORS = [
  'article[data-testid="tweet"]',
  'article[role="article"]',
] as const;

/**
 * Stable media container selectors with fallback chain
 *
 * @remarks
 * Covers both image and video containers:
 * 1. `tweetPhoto` - Image containers
 * 2. `videoPlayer` - Video containers
 *
 * @example
 * ```typescript
 * const mediaContainers = STABLE_MEDIA_CONTAINERS_SELECTORS
 *   .flatMap(sel => Array.from(document.querySelectorAll(sel)));
 * ```
 */
export const STABLE_MEDIA_CONTAINERS_SELECTORS = [
  '[data-testid="tweetPhoto"]',
  '[data-testid="videoPlayer"]',
] as const;

/**
 * Stable video container selectors with fallback chain
 *
 * @remarks
 * Video-specific selectors:
 * 1. `videoPlayer` testid - Most reliable
 * 2. Generic `video` element - Broad fallback
 *
 * @example
 * ```typescript
 * const videoElement = STABLE_VIDEO_CONTAINERS_SELECTORS
 *   .map(sel => element.querySelector(sel))
 *   .find(Boolean);
 * ```
 */
export const STABLE_VIDEO_CONTAINERS_SELECTORS = ['[data-testid="videoPlayer"]', 'video'] as const;

/**
 * Stable image container selectors with fallback chain
 *
 * @remarks
 * Image-specific selectors:
 * 1. `tweetPhoto` testid - Most reliable
 * 2. Twitter CDN images - Broad content-based fallback
 *
 * @example
 * ```typescript
 * const imageContainer = STABLE_IMAGE_CONTAINERS_SELECTORS
 *   .map(sel => element.querySelector(sel))
 *   .find(Boolean);
 * ```
 */
export const STABLE_IMAGE_CONTAINERS_SELECTORS = [
  '[data-testid="tweetPhoto"]',
  'img[src*="pbs.twimg.com"]',
] as const;

/**
 * Stable media viewer overlay selectors with fallback chain
 *
 * @remarks
 * Selectors for Twitter's native media viewer/lightbox:
 * 1. `photoViewer` - Official photo viewer testid
 * 2. Modal drawer - Generic modal pattern with testid
 * 3. Carousel role - ARIA-based carousel detection
 *
 * @example
 * ```typescript
 * const isViewerOpen = STABLE_MEDIA_VIEWERS_SELECTORS
 *   .some(sel => document.querySelector(sel) !== null);
 * ```
 */
export const STABLE_MEDIA_VIEWERS_SELECTORS = [
  '[data-testid="photoViewer"]',
  '[aria-modal="true"][data-testid="Drawer"]',
  '[aria-roledescription="carousel"]',
] as const;

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Type helper: Extract selector string from single selector constant
 *
 * @example
 * ```typescript
 * type TweetSelectorType = SelectorString<typeof TWEET_SELECTOR>;
 * // "article[data-testid=\"tweet\"]"
 * ```
 */
export type SelectorString<T extends string> = T;

/**
 * Type helper: Extract selector union from selector array constant
 *
 * @example
 * ```typescript
 * type MediaSelectors = SelectorArray<typeof STABLE_MEDIA_CONTAINERS_SELECTORS>;
 * // "[data-testid=\"tweetPhoto\"]" | "[data-testid=\"videoPlayer\"]"
 * ```
 */
export type SelectorArray<T extends readonly string[]> = T[number];
