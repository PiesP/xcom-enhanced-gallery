// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Tweet Info Extractor - Simplified Functional Pipeline
 * @description Extracts tweet metadata using a concise strategy pipeline.
 */

import { STATUS_LINK_SELECTOR, TWEET_CONTAINER_SELECTORS } from '@constants/selectors';
import { logger } from '@shared/logging/logger';
import type { TweetClickContext, TweetInfo } from '@shared/types/media.types';
import { closestWithFallback } from '@shared/utils/dom/query-helpers';
import { extractUsernameFromUrl, isHostMatching, TWITTER_HOSTS } from '@shared/utils/url/host';
import { isValidMediaUrl } from '@shared/utils/url/validator';

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

/** Keep permalinks within the clicked ownership branch, excluding adjacent media. */
function getOwnStatusLinks(
  container: HTMLElement,
  element: HTMLElement
): Array<{ anchor: Element; link: TrustedStatusLink }> {
  return Array.from(container.querySelectorAll(STATUS_LINK_SELECTOR)).flatMap((anchor) => {
    if (anchor.closest('article') !== container.closest('article')) return [];
    if (anchor.closest('[data-testid="tweetText"]')) return [];
    const link = parseTrustedStatusLink(anchor.getAttribute('href') ?? '');
    if (!link) return [];
    let branch: Element | null = anchor;
    while (branch && branch !== container && !branch.contains(element)) {
      // A native permalink's own link role is not a surrounding quote boundary.
      if (
        (branch !== anchor && branch.matches('[role="link"]')) ||
        branch.matches('[data-testid="quoteTweet"], [data-testid="card.wrapper"]')
      )
        return [];
      if (
        Array.from(branch.querySelectorAll('img, video')).some((media) =>
          [media.getAttribute('src'), media.getAttribute('poster')].some(
            (url) => url && isValidMediaUrl(url)
          )
        )
      )
        return [];
      branch = branch.parentElement;
    }
    return [{ anchor, link }];
  });
}

/** Strategy 3: Tweet container fallback */
const extractFromDOM: ExtractionStrategy = (element) => {
  const article = closestWithFallback<HTMLElement>(element, TWEET_CONTAINER_SELECTORS);
  if (!article) return null;
  let container = article;
  // Resolve the nearest branch's own permalink before the surrounding article.
  // Nested quote timestamps have already been excluded by getOwnStatusLinks.
  for (let scope = element.parentElement; scope && scope !== article; scope = scope.parentElement) {
    if (!article.contains(scope)) break;
    const scopeLinks = getOwnStatusLinks(scope, element);
    if (scope.matches('[data-testid="quoteTweet"]') || scopeLinks.length > 0) {
      container = scope;
      break;
    }
  }
  const ownLinks = getOwnStatusLinks(container, element);
  const timestamps = ownLinks.filter(({ anchor }) => anchor.querySelector('time'));
  const owners = timestamps.length ? timestamps : ownLinks;
  const ownerIds = new Set(owners.map(({ link }) => link?.tweetId));
  if (ownerIds.size !== 1) return null;
  const link = owners[0]?.link;
  if (!link) return null;

  return {
    ...link,
    extractionMethod: 'dom-structure',
    confidence: 0.85,
    metadata: {
      containerTag: container.tagName.toLowerCase(),
      isTweetContainer: container === article,
    },
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

function strictStatusLink(anchor: Element): TrustedStatusLink | null {
  try {
    const url = new URL(anchor.getAttribute('href') ?? '', DEFAULT_TWEET_ORIGIN);
    if (
      url.protocol !== 'https:' ||
      !['x.com', 'twitter.com'].includes(url.hostname) ||
      url.port ||
      url.username ||
      url.password ||
      !/^\/[A-Za-z0-9_]{1,15}\/status\/[1-9]\d*(?:\/(?:photo|video)\/\d+)?\/?$/u.test(url.pathname)
    )
      return null;
    return parseTrustedStatusLink(url.toString());
  } catch {
    return null;
  }
}

function requestInfo(
  article: HTMLElement,
  element: HTMLElement,
  boundary: HTMLElement,
  allowUntimed: boolean
): TweetInfo | null {
  const anchors = allowUntimed
    ? Array.from(article.querySelectorAll(STATUS_LINK_SELECTOR)).filter(
        (anchor) =>
          anchor.closest('article') === article &&
          !boundary.contains(anchor) &&
          !anchor.closest('[data-testid="tweetText"]')
      )
    : getOwnStatusLinks(article, element)
        .filter(({ anchor }) => !boundary.contains(anchor))
        .map(({ anchor }) => anchor);
  const links = anchors.flatMap((anchor) => {
    const link = strictStatusLink(anchor);
    return link ? [{ anchor, link }] : [];
  });
  if (allowUntimed && links.length !== anchors.length) return null;
  const timestamps = links.filter(({ anchor }) => anchor.querySelector('time'));
  // An immediate parent of a bounded nested quote may expose only untimed
  // permalinks. They establish a unique request, never a confirmed owner.
  const owners = allowUntimed ? links : timestamps;
  if (new Set(owners.map(({ link }) => link.tweetId)).size !== 1) return null;
  const link = owners[0]?.link;
  return link ? { ...link, extractionMethod: 'request-context', confidence: 0.85 } : null;
}

/** Keep query context separate from ownership in a bounded clickable branch. */
function extractClickContext(element: HTMLElement): TweetClickContext | null {
  let owner = extractTweetInfo(element);
  const enclosing = element.closest(STATUS_LINK_SELECTOR);
  const enclosingOwner = enclosing ? strictStatusLink(enclosing) : null;
  const attributeId = element.dataset.tweetId;
  if (attributeId && enclosingOwner && attributeId !== enclosingOwner.tweetId) return null;
  const domOwner = extractFromDOM(element);
  if (attributeId && domOwner && attributeId !== domOwner.tweetId) return null;

  const owned = (info: TweetInfo): TweetClickContext => ({
    tweetInfo: info,
    ownership: Object.freeze({
      requestTweetId: info.tweetId,
      ownerTweetId: info.tweetId,
      scope: 'owned',
    }),
  });
  if (enclosingOwner || attributeId) return owner ? owned(owner) : null;

  const article = closestWithFallback<HTMLElement>(element, TWEET_CONTAINER_SELECTORS);
  if (!article) return owner ? owned(owner) : null;
  if (element.closest('[data-testid="card.wrapper"], [data-testid="reply"]')) return null;

  let boundary: HTMLElement | null = null;
  for (
    let node = element.parentElement, hops = 0;
    node && node !== article && hops < 16;
    node = node.parentElement, hops++
  ) {
    if (node.matches('[data-testid="quoteTweet"]')) {
      boundary = node;
      break;
    }
    if (!boundary && node.matches('[role="link"]') && !(node instanceof HTMLAnchorElement))
      boundary = node;
  }
  let requestArticle = article;
  const parentArticle = article.parentElement?.closest<HTMLElement>('article');
  if (parentArticle) {
    const articleAnchors = Array.from(article.querySelectorAll(STATUS_LINK_SELECTOR)).filter(
      (anchor) =>
        anchor.closest('article') === article && !anchor.closest('[data-testid="tweetText"]')
    );
    const ownIds = new Set<string>();
    for (const anchor of articleAnchors) {
      const link = strictStatusLink(anchor);
      if (!link) return null;
      ownIds.add(link.tweetId);
    }
    // A narrower media branch can contain a credit permalink while the nested
    // article has a different header. Neither non-enclosing link proves which
    // tweet owns the media, even when legacy extraction found one narrow link.
    if (!boundary && ownIds.size > 1) owner = null;
  }
  if (
    !boundary &&
    owner?.metadata?.isTweetContainer === true &&
    new Set(getOwnStatusLinks(article, element).map(({ link }) => link.tweetId)).size > 1
  )
    owner = null;
  if (!boundary && !owner) {
    // A nested article can be a quote candidate only inside its immediate
    // parent's clickable boundary. Never borrow a neighboring reply or page URL.
    if (parentArticle) {
      for (
        let node = article.parentElement, hops = 0;
        node && node !== parentArticle && hops < 16;
        node = node.parentElement, hops++
      ) {
        if (node.matches('[data-testid="card.wrapper"], [data-testid="reply"]')) return null;
        if (
          node.matches('[data-testid="quoteTweet"], [role="link"]') &&
          !(node instanceof HTMLAnchorElement)
        ) {
          boundary = node;
          break;
        }
      }
      if (boundary) requestArticle = parentArticle;
    }
  }
  if (!boundary) return owner ? owned(owner) : null;

  const boundaryLinks = getOwnStatusLinks(boundary, element);
  if (
    owner &&
    new Set(boundaryLinks.map(({ link }) => link.tweetId)).size === 1 &&
    boundaryLinks.some(({ link }) => link.tweetId === owner.tweetId)
  )
    return owned(owner);
  // An explicit foreign or conflicting permalink is not missing evidence.
  if (
    Array.from(boundary.querySelectorAll(STATUS_LINK_SELECTOR)).some(
      (anchor) =>
        anchor.closest('article') === article &&
        !anchor.closest('[data-testid="tweetText"]') &&
        !strictStatusLink(anchor)
    )
  )
    return null;
  if (boundaryLinks.length > 0 && requestArticle === article) return null;
  const context = requestInfo(requestArticle, element, boundary, requestArticle !== article);
  if (!context) return null;
  const quoteMarked = element.closest('[data-testid="quoteTweet"]');
  return {
    tweetInfo: context,
    ownership: Object.freeze({
      requestTweetId: context.tweetId,
      ownerTweetId: null,
      scope:
        boundary.matches('[data-testid="quoteTweet"]') ||
        (quoteMarked && requestArticle.contains(quoteMarked))
          ? 'quoted'
          : 'clickable',
    }),
  };
}

// Backward-compatible class wrapper (for existing callers)
export class TweetInfoExtractor {
  extract(element: HTMLElement): TweetInfo | null {
    return extractTweetInfo(element);
  }

  extractContext(element: HTMLElement): TweetClickContext | null {
    return extractClickContext(element);
  }
}
