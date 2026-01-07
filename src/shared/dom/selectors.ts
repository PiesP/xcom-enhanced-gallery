/**
 * @fileoverview Standard selector registry and query helpers
 * @description Centralized entry point for DOM selectors and selector-based query utilities.
 * Provides typed access to X.com element selectors and fallback query helpers.
 *
 * @module shared/dom/selectors
 *
 * @remarks
 * This module serves as the primary interface for DOM selection operations:
 * - Exports all stable selector constants from `@constants/selectors`
 * - Provides fallback-aware query helper functions
 * - Consolidates selector usage patterns across features
 *
 * **Usage Guidelines**:
 * - Prefer importing from this module for consistency
 * - Use `*WithFallback` helpers for resilient queries
 * - Consult selector constants documentation for stability notes
 *
 * @example Standard selector usage
 * ```typescript
 * import { TWEET_SELECTOR, querySelectorWithFallback } from '@shared/dom/selectors';
 *
 * // Single selector
 * const tweet = document.querySelector(TWEET_SELECTOR);
 *
 * // Fallback query
 * const container = querySelectorWithFallback(
 *   document,
 *   STABLE_TWEET_CONTAINERS_SELECTORS
 * );
 * ```
 *
 * @see {@link module:constants/selectors} for selector constant definitions
 * @see {@link module:shared/utils/dom/query-helpers} for query helper implementations
 */

// ============================================================================
// Selector Constants
// ============================================================================

/**
 * Gallery overlay selector constant
 * @see {@link GALLERY_OVERLAY_SELECTOR}
 */
/**
 * Stable image container selectors with fallback chain
 * @see {@link STABLE_IMAGE_CONTAINERS_SELECTORS}
 */
/**
 * Stable media container selectors (images + videos) with fallback chain
 * @see {@link STABLE_MEDIA_CONTAINERS_SELECTORS}
 */
/**
 * Stable media viewer overlay selectors with fallback chain
 * @see {@link STABLE_MEDIA_VIEWERS_SELECTORS}
 */
/**
 * Stable tweet container selectors with fallback chain
 * @see {@link STABLE_TWEET_CONTAINERS_SELECTORS}
 */
/**
 * Stable video container selectors with fallback chain
 * @see {@link STABLE_VIDEO_CONTAINERS_SELECTORS}
 */
/**
 * Status link selector (tweet permalink)
 * @see {@link STATUS_LINK_SELECTOR}
 */
/**
 * Combined tweet article selector with fallback
 * @see {@link TWEET_ARTICLE_SELECTOR}
 */
/**
 * Tweet photo container selector
 * @see {@link TWEET_PHOTO_SELECTOR}
 */
/**
 * Tweet article container selector (primary)
 * @see {@link TWEET_SELECTOR}
 */
/**
 * Tweet text content selector
 * @see {@link TWEET_TEXT_SELECTOR}
 */
/**
 * Twitter media CDN selector
 * @see {@link TWITTER_MEDIA_SELECTOR}
 */
/**
 * Extended video player context selector with multiple fallbacks
 * @see {@link VIDEO_PLAYER_CONTEXT_SELECTOR}
 */
/**
 * Video player container selector
 * @see {@link VIDEO_PLAYER_SELECTOR}
 */
export {
  GALLERY_OVERLAY_SELECTOR,
  STABLE_IMAGE_CONTAINERS_SELECTORS,
  STABLE_MEDIA_CONTAINERS_SELECTORS,
  STABLE_MEDIA_VIEWERS_SELECTORS,
  STABLE_TWEET_CONTAINERS_SELECTORS,
  STABLE_VIDEO_CONTAINERS_SELECTORS,
  STATUS_LINK_SELECTOR,
  TWEET_ARTICLE_SELECTOR,
  TWEET_PHOTO_SELECTOR,
  TWEET_SELECTOR,
  TWEET_TEXT_SELECTOR,
  TWITTER_MEDIA_SELECTOR,
  VIDEO_PLAYER_CONTEXT_SELECTOR,
  VIDEO_PLAYER_SELECTOR,
} from '@constants/selectors';

// ============================================================================
// Query Helper Functions
// ============================================================================

/**
 * Find closest ancestor matching any of the fallback selectors
 * @see {@link closestWithFallback}
 */
/**
 * Query all elements with fallback selectors (deduplicated)
 * @see {@link queryAllWithFallback}
 */
/**
 * Query a single element with fallback selectors
 * @see {@link querySelectorWithFallback}
 */
export {
  closestWithFallback,
  queryAllWithFallback,
  querySelectorWithFallback,
} from '@shared/utils/dom/query-helpers';
