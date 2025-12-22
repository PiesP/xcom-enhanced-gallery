/**
 * @fileoverview Tweet text HTML extraction utility
 * @description Extracts and sanitizes tweet text HTML from DOM
 * @version 1.0.0 - Phase 2: DOM HTML preservation
 */

import { TWEET_SELECTOR, TWEET_TEXT_SELECTOR } from '@shared/dom/selectors';
import { logger } from '@shared/logging';

/**
 * Extracts tweet text HTML from tweet article element
 * Searches for [data-testid="tweetText"] element and sanitizes its HTML
 *
 * @param tweetArticle - Tweet article element or any parent element
 * @returns Sanitized HTML string or undefined if not found
 *
 * @example
 * ```typescript
 * const tweetArticle = document.querySelector(TWEET_SELECTOR);
 * const html = extractTweetTextHTML(tweetArticle);
 * // '<span>Tweet with <a href="...">link</a> and #hashtag</span>'
 * ```
 */
export function extractTweetTextHTML(tweetArticle: Element | null): string | undefined {
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
 * Extracts tweet text HTML from a clicked element by traversing up to find tweet article
 *
 * @param element - Clicked element
 * @param maxDepth - Maximum depth to traverse (default: 10)
 * @returns Sanitized HTML string or undefined
 */
export function extractTweetTextHTMLFromClickedElement(
  element: HTMLElement,
  maxDepth = 10
): string | undefined {
  let current: HTMLElement | null = element;
  let depth = 0;

  // Traverse up to find tweet article
  while (current && depth < maxDepth) {
    // Check if current element is a tweet article
    if (
      current.tagName === 'ARTICLE' &&
      (current.hasAttribute('data-testid') || current.querySelector(TWEET_SELECTOR))
    ) {
      return extractTweetTextHTML(current);
    }

    current = current.parentElement;
    depth++;
  }

  if (__DEV__) {
    logger.debug('[tweet] no article in depth', { maxDepth });
  }
  return undefined;
}
