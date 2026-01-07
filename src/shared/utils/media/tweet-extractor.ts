/**
 * @fileoverview Tweet text extraction utility
 * @description Extracts tweet text content from DOM elements
 */

import {
  closestWithFallback,
  STABLE_TWEET_CONTAINERS_SELECTORS,
  TWEET_TEXT_SELECTOR,
} from '@shared/dom/selectors';
import { logger } from '@shared/logging/logger';

/**
 * Extracts tweet text from tweet article element
 * Searches for [data-testid="tweetText"] element and returns its text content
 *
 * @param tweetArticle - Tweet article element or any parent element
 * @returns Extracted text content, or undefined if element not found or text is empty
 *
 * @example
 * ```typescript
 * const tweetArticle = document.querySelector(TWEET_SELECTOR);
 * const text = extractTweetTextHTML(tweetArticle);
 * // 'Tweet with link and #hashtag'
 * ```
 */
function extractTweetTextHTML(tweetArticle: Element | null): string | undefined {
  if (!tweetArticle) return undefined;

  try {
    // Find tweet text element
    const tweetTextElement = tweetArticle.querySelector(TWEET_TEXT_SELECTOR);
    if (!tweetTextElement) {
      if (__DEV__) {
        logger.debug('[tweet] no tweetText element');
      }
      return undefined;
    }

    const text = tweetTextElement.textContent?.trim();
    if (!text) {
      if (__DEV__) {
        logger.debug('[tweet] empty text');
      }
      return undefined;
    }

    if (__DEV__) {
      logger.debug('[tweet] extracted', { length: text.length });
    }

    return text;
  } catch (error) {
    logger.error('[tweet] extract failed', error);
    return undefined;
  }
}

/**
 * Extracts tweet text from a clicked element by traversing up to find tweet article
 *
 * @param element - Clicked element
 * @param _maxDepth - Reserved parameter for API stability (currently unused; closestWithFallback handles depth)
 * @returns Extracted tweet text, or undefined if tweet article not found or text is empty
 *
 * @remarks
 * The maxDepth parameter is kept for backwards compatibility with existing callers.
 * The underlying closestWithFallback utility does not currently support depth limiting.
 * If depth limiting becomes necessary, introduce a dedicated traversal helper.
 */
export function extractTweetTextHTMLFromClickedElement(
  element: HTMLElement,
  _maxDepth = 10
): string | undefined {
  const tweetArticle = closestWithFallback<HTMLElement>(element, STABLE_TWEET_CONTAINERS_SELECTORS);
  if (tweetArticle) {
    return extractTweetTextHTML(tweetArticle);
  }

  if (__DEV__) {
    logger.debug('[tweet] no article found');
  }
  return undefined;
}
