// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Tweet Info Extractor - Simplified Functional Pipeline
 * @description Extracts tweet metadata using a concise strategy pipeline.
 */

import { STATUS_LINK_SELECTOR, TWEET_CONTAINER_SELECTORS } from '@constants/selectors';
import { logger } from '@shared/logging/logger';
import type { TweetInfo } from '@shared/types/media.types';
import { closestWithFallback } from '@shared/utils/dom/query-helpers';
import { extractUsernameFromUrl, isHostMatching, TWITTER_HOSTS } from '@shared/utils/url/host';

type ExtractionStrategy = (element: HTMLElement) => TweetInfo | null;

const DEFAULT_TWEET_ORIGIN = 'https://x.com';
const STATUS_PATH_PATTERN = /\/status\/(\d+)(?:\/|$)/u;

interface TrustedStatusLink {
  readonly tweetId: string;
  readonly username: string;
  readonly tweetUrl: string;
}

const parseTrustedStatusLink = (inputUrl: string): TrustedStatusLink | null => {
  try {
    const url = new URL(inputUrl, DEFAULT_TWEET_ORIGIN);
    if (
      !isHostMatching(url, TWITTER_HOSTS, { allowSubdomains: true }) ||
      (url.protocol !== 'https:' && url.protocol !== 'http:')
    ) {
      return null;
    }

    const match = url.pathname.match(STATUS_PATH_PATTERN);
    const tweetId = match?.[1];
    if (!tweetId) return null;

    // Normalize all trusted Twitter/X links to a credential-free x.com URL.
    url.protocol = 'https:';
    url.hostname = 'x.com';
    url.port = '';
    url.username = '';
    url.password = '';

    return {
      tweetId,
      username: extractUsernameFromUrl(url.toString(), { strictHost: true }) ?? 'unknown',
      tweetUrl: url.toString(),
    };
  } catch {
    return null;
  }
};

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
      tweetUrl: `https://x.com/i/status/${dataId}`,
      extractionMethod: 'element-attribute',
      confidence: 0.9,
    };
  }

  // 2. href attribute (e.g. timestamp link)
  const href = element.getAttribute('href');
  if (href) {
    const link = parseTrustedStatusLink(href);
    if (link) {
      return {
        ...link,
        extractionMethod: 'element-href',
        confidence: 0.8,
      };
    }
  }

  return null;
};

/** Strategy 3: Tweet container fallback */
const extractFromDOM: ExtractionStrategy = (element) => {
  const container = closestWithFallback<HTMLElement>(element, TWEET_CONTAINER_SELECTORS);
  if (!container) return null;

  // Find status link
  const statusLink = container.querySelector(STATUS_LINK_SELECTOR);
  if (!statusLink) return null;

  const href = statusLink.getAttribute('href');
  if (!href) return null;

  const link = parseTrustedStatusLink(href);
  if (!link) return null;

  return {
    ...link,
    extractionMethod: 'dom-structure',
    confidence: 0.85,
    metadata: { containerTag: container.tagName.toLowerCase() },
  };
};

/** Strategy 2: Status link enclosing the clicked media */
const extractFromMediaGridItem: ExtractionStrategy = (element) => {
  // Media links use paths such as /User/status/ID/photo/1 or /video/1.
  const link = element.closest(STATUS_LINK_SELECTOR);
  if (!link) return null;

  const href = link.getAttribute('href');
  if (!href) return null;

  const trustedLink = parseTrustedStatusLink(href);
  if (!trustedLink) return null;

  return {
    ...trustedLink,
    extractionMethod: 'media-grid-item',
    confidence: 0.8,
  };
};

// ============================================================================
// Main export — functional pipeline
// ============================================================================

const strategies: readonly ExtractionStrategy[] = [
  extractFromElement,
  extractFromMediaGridItem,
  extractFromDOM,
];

function isValidTweetInfo(info: TweetInfo): boolean {
  return !!info.tweetId && /^\d+$/.test(info.tweetId) && info.tweetId !== 'unknown';
}

/**
 * Extract tweet info from a DOM element using a strategy pipeline.
 * Tries strategies in order: element attributes → enclosing status link → tweet container.
 */
function extractTweetInfo(element: HTMLElement): TweetInfo | null {
  for (const strategy of strategies) {
    try {
      const result = strategy(element);
      if (result && isValidTweetInfo(result)) {
        if (__DEV__) {
          logger.debug(`[TweetInfoExtractor] Success: ${result.extractionMethod}`, {
            tweetId: result.tweetId,
          });
        }
        return result;
      }
    } catch {
      // Continue to next strategy
    }
  }
  return null;
}

// Backward-compatible class wrapper (for existing callers)
export class TweetInfoExtractor {
  extract(element: HTMLElement): TweetInfo | null {
    return extractTweetInfo(element);
  }
}
