/**
 * @fileoverview Tweet text HTML extraction utility
 * @description Extracts and sanitizes tweet text HTML from DOM
 * @version 1.0.0 - Phase 2: DOM HTML preservation
 */

import { SELECTORS } from '@constants';
import { logger } from '@shared/logging';
import { sanitizeHTML } from '@shared/utils/text/html-sanitizer';

/**
 * Extracts tweet text HTML from tweet article element
 * Searches for [data-testid="tweetText"] element and sanitizes its HTML
 *
 * @param tweetArticle - Tweet article element or any parent element
 * @returns Sanitized HTML string or undefined if not found
 *
 * @example
 * ```typescript
 * const tweetArticle = document.querySelector(SELECTORS.TWEET);
 * const html = extractTweetTextHTML(tweetArticle);
 * // '<span>Tweet with <a href="...">link</a> and #hashtag</span>'
 * ```
 */
export function extractTweetTextHTML(tweetArticle: Element | null): string | undefined {
  if (!tweetArticle) return undefined;

  try {
    // Find tweet text element
    const tweetTextElement = tweetArticle.querySelector(SELECTORS.TWEET_TEXT);
    if (!tweetTextElement) {
      logger.debug('[extractTweetTextHTML] tweetText element not found');
      return undefined;
    }

    // Get innerHTML
    const rawHTML = tweetTextElement.innerHTML;
    if (!rawHTML?.trim()) {
      logger.debug('[extractTweetTextHTML] Empty HTML content');
      return undefined;
    }

    // Sanitize HTML for safe rendering
    const sanitized = sanitizeHTML(rawHTML);

    if (!sanitized?.trim()) {
      logger.debug('[extractTweetTextHTML] HTML sanitization resulted in empty content');
      return undefined;
    }

    logger.debug('[extractTweetTextHTML] Successfully extracted and sanitized HTML', {
      originalLength: rawHTML.length,
      sanitizedLength: sanitized.length,
    });

    return sanitized;
  } catch (error) {
    logger.error('[extractTweetTextHTML] Error extracting tweet text HTML:', error);
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
  maxDepth = 10,
): string | undefined {
  let current: HTMLElement | null = element;
  let depth = 0;

  // Traverse up to find tweet article
  while (current && depth < maxDepth) {
    // Check if current element is a tweet article
    if (
      current.tagName === 'ARTICLE' &&
      (current.hasAttribute('data-testid') || current.querySelector(SELECTORS.TWEET))
    ) {
      return extractTweetTextHTML(current);
    }

    current = current.parentElement;
    depth++;
  }

  logger.debug('[extractTweetTextHTMLFromClickedElement] Tweet article not found within depth', {
    maxDepth,
  });
  return undefined;
}
