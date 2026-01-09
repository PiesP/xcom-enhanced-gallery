/**
 * Extracts tweet text content from DOM elements
 */

import {
  closestWithFallback,
  STABLE_TWEET_CONTAINERS_SELECTORS,
  TWEET_TEXT_SELECTOR,
} from '@shared/dom/selectors';
import { logger } from '@shared/logging/logger';

/**
 * Extracts tweet text from tweet article element
 *
 * @param tweetArticle - Tweet article element
 * @returns Text content or undefined if not found
 */
function extractTweetTextHTML(tweetArticle: Element | null): string | undefined {
  if (!tweetArticle) return undefined;

  try {
    const tweetTextElement = tweetArticle.querySelector(TWEET_TEXT_SELECTOR);
    if (!tweetTextElement) return undefined;

    const text = tweetTextElement.textContent?.trim();
    if (!text) return undefined;

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
 * Extracts tweet text from clicked element by traversing up
 *
 * @param element - Clicked element
 * @param _maxDepth - Reserved for API stability (unused)
 * @returns Tweet text or undefined
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
