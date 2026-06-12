// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Extracts tweet text content from DOM elements
 */

import { TWEET_CONTAINER_SELECTORS, TWEET_TEXT_SELECTOR } from '@constants/selectors';
import { logger } from '@shared/logging/logger';
import { closestWithFallback } from '@shared/utils/dom/query-helpers';

/**
 * Extracts tweet text from tweet article element
 *
 * @param tweetArticle - Tweet article element
 * @returns Text content or undefined if not found
 */
function extractTweetText(tweetArticle: Element | null): string | undefined {
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
    logger.debug('[tweet] extract failed', error);
    return undefined;
  }
}

/**
 * Extracts tweet text from clicked element by traversing up
 *
 * @param element - Clicked element
 * @returns Tweet text or undefined
 */
export function extractTweetTextHTMLFromClickedElement(element: HTMLElement): string | undefined {
  const tweetArticle = closestWithFallback<HTMLElement>(element, TWEET_CONTAINER_SELECTORS);
  if (tweetArticle) {
    return extractTweetText(tweetArticle);
  }

  if (__DEV__) {
    logger.debug('[tweet] no article found');
  }
  return undefined;
}
