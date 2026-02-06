/**
 * @fileoverview Media Click Detector - Handles media click detection and validation
 * @description Detects clicks on image, video thumbnail, and video elements to trigger
 * the XEG gallery. Prevents triggering in contexts where native navigation should be preserved
 * (link cards, X Articles, media viewers). Validates media sources and element types.
 */

import { CSS } from '@constants/css';
import {
  STABLE_MEDIA_CONTAINERS_SELECTORS,
  STABLE_MEDIA_VIEWERS_SELECTORS,
  STATUS_LINK_SELECTOR,
} from '@shared/dom/selectors';
import { isVideoControlElement } from '@shared/dom/utils';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import {
  extractMediaUrlFromElement,
  findMediaElementInDOM,
} from '@shared/utils/media/media-element-utils';
import { isValidMediaUrl } from '@shared/utils/url/validator';

// ============================================================================
// Constants
// ============================================================================

/** Media link selectors - Profile grid and timeline media links */
const MEDIA_LINK_SELECTORS = [
  STATUS_LINK_SELECTOR,
  'a[href*="/photo/"]',
  'a[href*="/video/"]',
] as const;

/** Combined selector string for media links */
const MEDIA_LINK_SELECTOR: string = MEDIA_LINK_SELECTORS.join(', ');

/** Combined selector string for media containers */
const MEDIA_CONTAINER_SELECTOR: string = STABLE_MEDIA_CONTAINERS_SELECTORS.join(', ');

/** Interactive element selectors */
const INTERACTIVE_SELECTOR: string = [
  'button',
  'a',
  '[role="button"]',
  '[data-testid="like"]',
  '[data-testid="retweet"]',
  '[data-testid="reply"]',
  '[data-testid="share"]',
  '[data-testid="bookmark"]',
].join(', ');

// ============================================================================
// Media Validation
// ============================================================================

/** Check if URL is valid media source (Twitter URL or blob) */
function isValidMediaSource(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('blob:')) return true;
  return isValidMediaUrl(url);
}

// ============================================================================
// Block Detection
// ============================================================================

/**
 * Check if card wrapper contains media card (not link preview card)
 * @param cardWrapper - Card wrapper element
 * @returns true if card contains media that should open in gallery
 */
function isMediaCard(cardWrapper: HTMLElement): boolean {
  // Check for card_img pattern (media cards use pbs.twimg.com/card_img)
  const cardImages = cardWrapper.querySelectorAll('img[src*="pbs.twimg.com/card_img"]');
  if (cardImages.length > 0) return true;

  // Check if card has external navigation link
  const cardLinks = cardWrapper.querySelectorAll('a[href]');
  for (const link of cardLinks) {
    const href = (link as HTMLAnchorElement).href;
    // If card has external link (not status/photo/video link), it's a link preview card
    if (
      href &&
      !href.includes('/status/') &&
      !href.includes('/photo/') &&
      !href.includes('/video/')
    ) {
      return false;
    }
  }

  // If no external links and has images, likely a media card
  return cardWrapper.querySelector('img, video') !== null;
}

/**
 * Check if click target should block gallery trigger
 * @param target - Clicked element
 * @returns true if click should be blocked
 */
function shouldBlockMediaTrigger(target: HTMLElement | null): boolean {
  if (!target) return false;

  // Video controls should be blocked
  if (isVideoControlElement(target)) return true;

  // Gallery internal elements
  if (target.closest(CSS.SELECTORS.ROOT) || target.closest(CSS.SELECTORS.OVERLAY)) return true;

  // Check if inside card wrapper
  const cardWrapper = target.closest('[data-testid="card.wrapper"]');
  if (cardWrapper instanceof HTMLElement) {
    // Allow media cards, block link preview cards
    if (isMediaCard(cardWrapper)) {
      return false;
    }
    return true;
  }

  // Block media triggers inside other contexts that should preserve native navigation
  // (e.g., X Articles where media clicks open the article)
  const blockedContextSelector = [
    '[data-testid="twitterArticleReadView"]',
    '[data-testid="longformRichTextComponent"]',
    '[data-testid="twitterArticleRichTextView"]',
    '[data-testid="article-cover-image"]',
    ...STABLE_MEDIA_VIEWERS_SELECTORS,
    '[data-testid="swipe-to-dismiss"]',
    '[data-testid="mask"]',
  ].join(', ');

  if (target.closest(blockedContextSelector)) return true;

  // Interactive elements (buttons, links, etc.)
  const interactive = target.closest(INTERACTIVE_SELECTOR);
  if (interactive) {
    const matchesMediaLinkSelector = interactive.matches(MEDIA_LINK_SELECTOR);

    // If the user clicked inside an anchor that is not a tweet/status/media link,
    // do not trigger the gallery. This preserves native navigation for articles,
    // external link cards, profiles, etc. even when they contain images.
    if (interactive.tagName === 'A' && !matchesMediaLinkSelector) {
      return true;
    }

    // Keep existing behavior for non-anchor interactive elements (buttons, role=button, etc.).
    const matchesMediaContainerSelector = interactive.matches(MEDIA_CONTAINER_SELECTOR);
    const hasMediaContainerDescendant =
      interactive.querySelector(MEDIA_CONTAINER_SELECTOR) !== null;

    const isMediaLink =
      matchesMediaLinkSelector || matchesMediaContainerSelector || hasMediaContainerDescendant;
    return !isMediaLink;
  }

  return false;
}

/**
 * Check if element is processable media for gallery trigger
 * @param target - Clicked element
 * @returns true if valid media that should open gallery
 */
export function isProcessableMedia(target: HTMLElement | null): boolean {
  if (!target) return false;
  if (gallerySignals.isOpen.value) return false;
  if (shouldBlockMediaTrigger(target)) return false;

  const mediaElement = findMediaElementInDOM(target);
  if (mediaElement) {
    const mediaUrl = extractMediaUrlFromElement(mediaElement);
    if (isValidMediaSource(mediaUrl)) {
      return true;
    }
  }

  // Inside media containers (images/videos that have not fully loaded yet)
  return !!target.closest(MEDIA_CONTAINER_SELECTOR);
}
