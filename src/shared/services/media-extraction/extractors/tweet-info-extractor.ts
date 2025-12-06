/**
 * @fileoverview Tweet Info Extractor - Simplified Functional Pipeline
 * @description Extracts tweet metadata using a concise strategy pipeline.
 */

import { SELECTORS } from '@constants/selectors';
import { logger } from '@shared/logging';
import type { TweetInfo } from '@shared/types/media.types';
import { extractUsernameFromUrl } from '@shared/utils/url';

type ExtractionStrategy = (element: HTMLElement) => TweetInfo | null;

// ============================================================================
// Strategies
// ============================================================================

/** Strategy 1: Direct Element Attributes (Fastest) */
const extractFromElement: ExtractionStrategy = (element) => {
  // 1. data-tweet-id
  const dataId = element.dataset.tweetId;
  if (dataId && /^\d+$/.test(dataId)) {
    return {
      tweetId: dataId,
      username: element.dataset.user ?? 'unknown',
      tweetUrl: `https://twitter.com/i/status/${dataId}`,
      extractionMethod: 'element-attribute',
      confidence: 0.9,
    };
  }

  // 2. href attribute (e.g. timestamp link)
  const href = element.getAttribute('href');
  if (href) {
    const match = href.match(/\/status\/(\d+)/);
    if (match?.[1]) {
      return {
        tweetId: match[1],
        username: extractUsernameFromUrl(href) ?? 'unknown',
        tweetUrl: href.startsWith('http') ? href : `https://twitter.com${href}`,
        extractionMethod: 'element-href',
        confidence: 0.8,
      };
    }
  }

  return null;
};

/** Strategy 2: DOM Structure (Most Reliable) */
const extractFromDOM: ExtractionStrategy = (element) => {
  const container = element.closest(SELECTORS.TWEET_ARTICLE);
  if (!container) return null;

  // Find status link
  const statusLink = container.querySelector(SELECTORS.STATUS_LINK);
  if (!statusLink) return null;

  const href = statusLink.getAttribute('href');
  if (!href) return null;

  const match = href.match(/\/status\/(\d+)/);
  if (!match || !match[1]) return null;

  const tweetId = match[1];
  const username = extractUsernameFromUrl(href) ?? 'unknown';

  return {
    tweetId,
    username,
    tweetUrl: href.startsWith('http') ? href : `https://twitter.com${href}`,
    extractionMethod: 'dom-structure',
    confidence: 0.85,
    metadata: { containerTag: container.tagName.toLowerCase() },
  };
};

/** Strategy 3: Media Grid Item (For Media Tab) */
const extractFromMediaGridItem: ExtractionStrategy = (element) => {
  // On media tabs, images are wrapped in links like /User/status/ID/photo/1
  const link = element.closest('a');
  if (!link) return null;

  const href = link.getAttribute('href');
  if (!href) return null;

  // Match /status/ID
  const match = href.match(/\/status\/(\d+)/);
  if (!match || !match[1]) return null;

  const tweetId = match[1];
  const username = extractUsernameFromUrl(href) ?? 'unknown';

  return {
    tweetId,
    username,
    tweetUrl: href.startsWith('http') ? href : `https://twitter.com${href}`,
    extractionMethod: 'media-grid-item',
    confidence: 0.8,
  };
};

// ============================================================================
// Main Class
// ============================================================================

export class TweetInfoExtractor {
  private readonly strategies: ExtractionStrategy[] = [
    extractFromElement,
    extractFromDOM,
    extractFromMediaGridItem,
  ];

  async extract(element: HTMLElement): Promise<TweetInfo | null> {
    for (const strategy of this.strategies) {
      try {
        const result = strategy(element);
        if (result && this.isValid(result)) {
          logger.debug(`[TweetInfoExtractor] Success: ${result.extractionMethod}`, {
            tweetId: result.tweetId,
          });
          return result;
        }
      } catch {
        // Continue to next strategy
      }
    }
    return null;
  }

  private isValid(info: TweetInfo): boolean {
    return !!info.tweetId && /^\d+$/.test(info.tweetId) && info.tweetId !== 'unknown';
  }
}
