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
import { DEFAULT_SETTINGS } from '@constants/settings';
import { getTypedSettingOr, tryGetSettings } from '@shared/container/settings-registry';
import { isVideoClickAllowed } from '@shared/dom/utils';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { getMediaClickTarget } from '@shared/utils/media/media-click-target';
import {
  extractMediaUrlFromElement,
  findMediaElementInDOM,
} from '@shared/utils/media/media-element-utils';
import { findNativeVideoControlMedia } from '@shared/utils/media/native-video-control';
import { isHostMatching, TWITTER_HOSTS, tryParseUrl } from '@shared/utils/url/host';
import { isValidMediaUrl } from '@shared/utils/url/validator';

const MEDIA_LINK_SELECTOR = [STATUS_LINK_SELECTOR, 'a[href*="/photo/"]', 'a[href*="/video/"]'].join(
  ', '
);
const MEDIA_CONTAINER_SELECTOR = MEDIA_CONTAINER_SELECTORS.join(', ');
const INTERACTIVE_SELECTOR = [
  'button',
  'input',
  '[role="slider"]',
  'a',
  '[role="button"]',
  '[data-testid="like"]',
  '[data-testid="retweet"]',
  '[data-testid="reply"]',
  '[data-testid="share"]',
  '[data-testid="bookmark"]',
].join(', ');

const STATUS_MEDIA_RE = /\/status\/\d+|\/photo\/\d+|\/video\/\d+/iu;
const STATUS_PHOTO_RE = /^\/[^/]+\/status\/\d+\/photo\/\d+\/?$/iu;
const isAllowAllNativeVideoControl = (target: HTMLElement, mode: string): boolean =>
  mode === 'allow-all' && findNativeVideoControlMedia(target) !== null;

function isNativeStatusMediaLink(href: string | null | undefined): boolean {
  if (!href) {
    return false;
  }
  const parsed = tryParseUrl(href);
  if (!parsed || !isHostMatching(parsed, TWITTER_HOSTS)) {
    return false;
  }
  return STATUS_MEDIA_RE.test(parsed.pathname);
}

function isMediaCard(cardWrapper: HTMLElement): boolean {
  for (const link of cardWrapper.querySelectorAll('a[href]')) {
    if (!isNativeStatusMediaLink((link as HTMLAnchorElement).getAttribute('href'))) {
      return false;
    }
  }
  if (cardWrapper.querySelector('img[src*="pbs.twimg.com/card_img"]')) {
    return true;
  }
  return cardWrapper.querySelector('img, video') !== null;
}

function closestSafe(element: HTMLElement | null, selector: string): Element | null {
  try {
    return element?.closest(selector) ?? null;
  } catch {
    return null;
  }
}

function isPhotoHit(target: HTMLElement, image: HTMLImageElement, event?: MouseEvent): boolean {
  const photoLink = target.closest('a[href]');
  if (
    photoLink instanceof HTMLAnchorElement &&
    photoLink.contains(image) &&
    !photoLink.textContent?.trim()
  ) {
    const href = tryParseUrl(photoLink.getAttribute('href') ?? '');
    if (href && isHostMatching(href, TWITTER_HOSTS) && STATUS_PHOTO_RE.test(href.pathname)) {
      return true;
    }
  }

  if (event && event.detail > 0) {
    const bounds = image.getBoundingClientRect();
    if (bounds.width > 0 && bounds.height > 0) {
      return (
        event.clientX >= bounds.left &&
        event.clientX < bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY < bounds.bottom
      );
    }
  }

  if (target === image || target.closest('[data-testid="tweetPhoto"]')?.contains(image)) {
    return true;
  }
  const link = target.closest('a[href]');
  if (!(link instanceof HTMLAnchorElement)) {
    return false;
  }
  if (link.contains(image)) {
    return !link.textContent?.trim();
  }
  const parent = link.parentElement;
  const imageLink = image.closest('a[href]');
  const matchesImageLink =
    imageLink instanceof HTMLAnchorElement &&
    imageLink.getAttribute('href') === link.getAttribute('href');
  if (
    (!link.getAttribute('aria-label')?.trim() && !matchesImageLink) ||
    link.textContent?.trim() ||
    link.childElementCount > 0 ||
    parent?.children.length !== 2 ||
    !Array.from(parent.children).some((sibling) => sibling !== link && sibling.contains(image))
  ) {
    return false;
  }
  const linkBounds = link.getBoundingClientRect();
  const imageBounds = image.getBoundingClientRect();
  if (
    linkBounds.width > 0 &&
    linkBounds.height > 0 &&
    imageBounds.width > 0 &&
    imageBounds.height > 0
  ) {
    return (
      Math.abs(linkBounds.left - imageBounds.left) <= 1 &&
      Math.abs(linkBounds.right - imageBounds.right) <= 1 &&
      Math.abs(linkBounds.top - imageBounds.top) <= 1 &&
      Math.abs(linkBounds.bottom - imageBounds.bottom) <= 1
    );
  }
  return true;
}

function shouldBlockMediaTrigger(target: HTMLElement | null, event?: MouseEvent): boolean {
  if (!target) {
    return false;
  }

  // Use isVideoClickAllowed with user-configured video click mode.
  // This is the secondary defense; the primary defense in handleMediaClick
  // already uses the same function with the full composedPath-based check.
  const settings = tryGetSettings();
  const videoMode = settings
    ? getTypedSettingOr('gallery.videoClickMode', DEFAULT_SETTINGS.gallery.videoClickMode)
    : DEFAULT_SETTINGS.gallery.videoClickMode;
  const getPath = event ? () => event.composedPath() : undefined;
  if (!isVideoClickAllowed(target, getPath, videoMode)) {
    return true;
  }
  // M10: Wrap closest() in try/catch via closestSafe to prevent invalid
  // selectors from breaking media click detection.
  if (closestSafe(target, CSS.SELECTORS.ROOT) || closestSafe(target, CSS.SELECTORS.OVERLAY)) {
    return true;
  }

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

  if (target.closest(blockedContext)) {
    return true;
  }

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
    return !isMediaLink && !isAllowAllNativeVideoControl(target, videoMode);
  }

  return false;
}

export function isProcessableMedia(target: Element | null, event?: MouseEvent): boolean {
  const htmlTarget = event
    ? getMediaClickTarget(event)
    : target instanceof HTMLElement
      ? target
      : null;
  if (event && target !== htmlTarget && target !== event.target) {
    return false;
  }
  if (!htmlTarget || gallerySignals.isOpen || shouldBlockMediaTrigger(htmlTarget, event)) {
    return false;
  }

  const settings = tryGetSettings();
  const videoMode = settings
    ? getTypedSettingOr('gallery.videoClickMode', DEFAULT_SETTINGS.gallery.videoClickMode)
    : DEFAULT_SETTINGS.gallery.videoClickMode;
  if (isAllowAllNativeVideoControl(htmlTarget, videoMode)) {
    return true;
  }

  const mediaElement = findMediaElementInDOM(htmlTarget);
  if (mediaElement) {
    const url = extractMediaUrlFromElement(mediaElement);
    if (url && (url.startsWith('blob:') || isValidMediaUrl(url))) {
      return (
        !(mediaElement instanceof HTMLImageElement) || isPhotoHit(htmlTarget, mediaElement, event)
      );
    }
  }

  return !!htmlTarget.closest(MEDIA_CONTAINER_SELECTOR);
}
