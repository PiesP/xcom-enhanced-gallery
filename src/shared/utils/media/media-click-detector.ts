// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Media click detector: validates clicks for gallery trigger.
 * Blocks triggers in contexts where native navigation should be preserved
 * (link cards, X Articles, media viewers, interactive elements).
 */

import { CSS } from '@constants/css';
import {
  MEDIA_CONTAINER_SELECTORS,
  MEDIA_VIEWER_SELECTORS,
  STATUS_LINK_SELECTOR,
} from '@constants/selectors';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import {
  extractMediaUrlFromElement,
  findMediaElementInDOM,
} from '@shared/utils/media/media-element-utils';
import { tryParseUrl } from '@shared/utils/url/host';
import { isValidMediaUrl } from '@shared/utils/url/validator';

const MEDIA_LINK_SELECTOR = [STATUS_LINK_SELECTOR, 'a[href*="/photo/"]', 'a[href*="/video/"]'].join(
  ', '
);
const MEDIA_CONTAINER_SELECTOR = MEDIA_CONTAINER_SELECTORS.join(', ');
const INTERACTIVE_SELECTOR = [
  'button',
  'a',
  '[role="button"]',
  '[data-testid="like"]',
  '[data-testid="retweet"]',
  '[data-testid="reply"]',
  '[data-testid="share"]',
  '[data-testid="bookmark"]',
].join(', ');

const TWITTER_HOST_RE = /(^|\.)(?:x|twitter)\.com$/iu;
const STATUS_MEDIA_RE = /\/status\/\d+|\/photo\/\d+|\/video\/\d+/iu;

function isValidMediaSource(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('blob:')) return true;
  return isValidMediaUrl(url);
}

function isNativeStatusMediaLink(href: string | null | undefined): boolean {
  if (!href) return false;
  const parsed = tryParseUrl(href);
  if (!parsed || !TWITTER_HOST_RE.test(parsed.hostname)) return false;
  return STATUS_MEDIA_RE.test(parsed.pathname);
}

function isMediaCard(cardWrapper: HTMLElement): boolean {
  for (const link of cardWrapper.querySelectorAll('a[href]')) {
    if (!isNativeStatusMediaLink((link as HTMLAnchorElement).getAttribute('href'))) return false;
  }
  if (cardWrapper.querySelector('img[src*="pbs.twimg.com/card_img"]')) return true;
  return cardWrapper.querySelector('img, video') !== null;
}

function shouldBlockMediaTrigger(target: HTMLElement | null): boolean {
  if (!target) return false;

  if (target.closest(CSS.SELECTORS.ROOT) || target.closest(CSS.SELECTORS.OVERLAY)) return true;

  const cardWrapper = target.closest('[data-testid="card.wrapper"]');
  if (cardWrapper instanceof HTMLElement) {
    return !isMediaCard(cardWrapper);
  }

  const blockedContext = [
    '[data-testid="twitterArticleReadView"]',
    '[data-testid="longformRichTextComponent"]',
    '[data-testid="twitterArticleRichTextView"]',
    '[data-testid="article-cover-image"]',
    ...MEDIA_VIEWER_SELECTORS,
    '[data-testid="swipe-to-dismiss"]',
    '[data-testid="mask"]',
  ].join(', ');

  if (target.closest(blockedContext)) return true;

  const interactive = target.closest(INTERACTIVE_SELECTOR);
  if (interactive) {
    if (
      interactive instanceof HTMLAnchorElement &&
      !isNativeStatusMediaLink(interactive.getAttribute('href'))
    ) {
      return true;
    }
    const isMediaLink =
      interactive instanceof HTMLAnchorElement
        ? isNativeStatusMediaLink(interactive.getAttribute('href'))
        : interactive.matches(MEDIA_LINK_SELECTOR) ||
          interactive.matches(MEDIA_CONTAINER_SELECTOR) ||
          interactive.querySelector(MEDIA_CONTAINER_SELECTOR) !== null;
    return !isMediaLink;
  }

  return false;
}

export function isProcessableMedia(target: HTMLElement | null): boolean {
  if (!target || gallerySignals.isOpen || shouldBlockMediaTrigger(target)) return false;

  const mediaElement = findMediaElementInDOM(target);
  if (mediaElement) {
    const url = extractMediaUrlFromElement(mediaElement);
    if (isValidMediaSource(url)) return true;
  }

  return !!target.closest(MEDIA_CONTAINER_SELECTOR);
}
