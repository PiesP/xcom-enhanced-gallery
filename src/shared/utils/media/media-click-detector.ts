/**
 * @fileoverview MediaClickDetector - Robust media click detector
 * @description Stable media click detection and handling logic with DOM caching optimization
 */

import { STABLE_SELECTORS, CSS } from "@/constants";
import { isVideoControlElement } from "@shared/utils/dom";
import { logger } from "@shared/logging";
import { cachedQuerySelector } from "@shared/dom";
import { gallerySignals } from "@shared/state/signals/gallery.signals";

/**
 * Media detection result
 */
export interface MediaDetectionResult {
  /** Detected media type */
  type: "video" | "image" | "none";
  /** Detected element */
  element: HTMLElement | null;
  /** Media URL (if available) */
  mediaUrl?: string;
  /** Detection confidence (0-1) */
  confidence: number;
  /** Detection method */
  method: string;
}

const GALLERY_INTERNAL_SELECTORS = CSS.INTERNAL_SELECTORS;

const UI_BUTTON_SELECTORS = [
  STABLE_SELECTORS.ACTION_BUTTONS.bookmark,
  STABLE_SELECTORS.ACTION_BUTTONS.retweet,
  STABLE_SELECTORS.ACTION_BUTTONS.like,
  STABLE_SELECTORS.ACTION_BUTTONS.reply,
  STABLE_SELECTORS.ACTION_BUTTONS.share,
  '[data-testid="User-Name"]',
  '[data-testid="UserAvatar"]',
];

const MEDIA_IN_LINK_SELECTORS = Array.from(
  new Set([
    ...STABLE_SELECTORS.IMAGE_CONTAINERS,
    ...STABLE_SELECTORS.MEDIA_PLAYERS,
  ]),
);

const TWEET_MEDIA_SELECTORS = MEDIA_IN_LINK_SELECTORS;

/**
 * Check if element is processable media
 */
export function isProcessableMedia(target: HTMLElement | null): boolean {
  if (!target) return false;

  logger.debug("MediaClickDetector: Checking processable media for:", {
    tagName: target.tagName,
    className: target.className,
    id: target.id,
    dataset: target.dataset,
  });

  if (gallerySignals.isOpen.value) {
    logger.debug("MediaClickDetector: Gallery already open - blocking");
    return false;
  }

  if (shouldBlockMediaTrigger(target)) {
    logger.debug("MediaClickDetector: Blocked by shouldBlockMediaTrigger");
    return false;
  }

  for (const selector of STABLE_SELECTORS.IMAGE_CONTAINERS) {
    if (target.closest(selector)) {
      logger.info(
        `✅ MediaClickDetector: Image container detected - ${selector}`,
      );
      return true;
    }
  }

  for (const selector of STABLE_SELECTORS.MEDIA_PLAYERS) {
    if (target.closest(selector)) {
      logger.info(`✅ MediaClickDetector: Media player detected - ${selector}`);
      return true;
    }
  }

  if (target.tagName === "IMG" || target.tagName === "VIDEO") {
    if (isTwitterMediaElement(target)) {
      logger.info("✅ MediaClickDetector: Direct Twitter media element click");
      return true;
    }
  }

  for (const selector of STABLE_SELECTORS.MEDIA_LINKS) {
    if (target.closest(selector)) {
      logger.info(`✅ MediaClickDetector: Media link detected - ${selector}`);
      return true;
    }
  }

  let tweetContainer: Element | null = null;
  for (const selector of STABLE_SELECTORS.TWEET_CONTAINERS) {
    const found = target.closest(selector);
    if (found) {
      tweetContainer = found;
      break;
    }
  }

  if (tweetContainer) {
    const hasMediaInTweet = tweetContainer.querySelector(
      TWEET_MEDIA_SELECTORS.join(", "),
    );
    if (hasMediaInTweet) {
      const mediaRect = hasMediaInTweet.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const isNearMedia =
        targetRect.left < mediaRect.right &&
        targetRect.right > mediaRect.left &&
        targetRect.top < mediaRect.bottom &&
        targetRect.bottom > mediaRect.top;

      if (isNearMedia) {
        logger.info("✅ MediaClickDetector: Tweet area with media click");
        return true;
      }
    }
  }

  logger.debug("MediaClickDetector: No media detected");
  return false;
}

export function shouldBlockMediaTrigger(target: HTMLElement | null): boolean {
  if (!target) return false;

  if (isVideoControlElement(target)) {
    logger.debug(
      "MediaClickDetector: Video control element click - allow default action",
    );
    return true;
  }

  for (const selector of GALLERY_INTERNAL_SELECTORS) {
    if (target.closest(selector)) {
      logger.debug(
        "MediaClickDetector: Gallery internal element click - block",
      );
      return true;
    }
  }

  for (const selector of UI_BUTTON_SELECTORS) {
    if (target.closest(selector)) {
      logger.debug(`MediaClickDetector: UI button click blocked - ${selector}`);
      return true;
    }
  }

  const mcSel = STABLE_SELECTORS.MEDIA_CONTAINERS.join(", ");

  // Image in external link: exclude media container
  if (target.tagName === "IMG") {
    const parentLink = target.closest("a");
    if (parentLink) {
      // Check if it is a status link on X/Twitter
      const isStatusLink = (href: string) => {
        try {
          const url = new URL(href, window.location.href);
          const isTwitter = /(?:^|\.)(?:twitter|x)\.com$/.test(url.hostname);
          return isTwitter && url.pathname.includes("/status/");
        } catch {
          return false;
        }
      };

      if (!isStatusLink(parentLink.href) && !target.closest(mcSel)) {
        return true;
      }
    }
  }

  const statusLink = target.closest('a[href*="/status/"]');
  if (!statusLink) return false;

  if (target.closest(mcSel)) {
    logger.debug("MediaClickDetector: Link in media container - allow gallery");
    return false;
  }

  if (
    cachedQuerySelector(MEDIA_IN_LINK_SELECTORS.join(", "), statusLink, 2000)
  ) {
    logger.debug("MediaClickDetector: Link with media - allow gallery");
    return false;
  }

  logger.debug("MediaClickDetector: Pure text link click blocked");
  return true;
}

/**
 * Extract media information from clicked element
 */
export function detectMediaFromClick(
  target: HTMLElement,
): MediaDetectionResult {
  try {
    if (target.tagName === "IMG" && isTwitterMediaElement(target)) {
      const img = target as HTMLImageElement;
      return {
        type: "image",
        element: target,
        mediaUrl: img.src,
        confidence: 1.0,
        method: "direct_element",
      };
    }

    if (target.tagName === "VIDEO" && isTwitterMediaElement(target)) {
      const video = target as HTMLVideoElement;
      return {
        type: "video",
        element: target,
        mediaUrl: video.src || video.currentSrc,
        confidence: 1.0,
        method: "direct_element",
      };
    }

    for (const selector of STABLE_SELECTORS.IMAGE_CONTAINERS) {
      const container = target.closest(selector) as HTMLElement | null;
      if (!container) continue;

      if (container.tagName === "IMG" && isTwitterMediaElement(container)) {
        const img = container as HTMLImageElement;
        return {
          type: "image",
          element: img,
          mediaUrl: img.src,
          confidence: 0.9,
          method: `container_search:self:${selector}`,
        };
      }

      const candidateImg = container.querySelector(
        "img",
      ) as HTMLImageElement | null;
      if (candidateImg && isTwitterMediaElement(candidateImg)) {
        return {
          type: "image",
          element: candidateImg,
          mediaUrl: candidateImg.src,
          confidence: 0.9,
          method: `container_search:descendant:${selector}`,
        };
      }
    }

    for (const selector of STABLE_SELECTORS.MEDIA_PLAYERS) {
      const container = target.closest(selector) as HTMLElement | null;
      if (!container) continue;

      if (container.tagName === "VIDEO") {
        const video = container as HTMLVideoElement;
        return {
          type: "video",
          element: video,
          mediaUrl: video.src || video.currentSrc,
          confidence: 0.9,
          method: `player_search:self:${selector}`,
        };
      }

      const video = container.querySelector("video") as HTMLVideoElement | null;
      if (video) {
        return {
          type: "video",
          element: video,
          mediaUrl: video.src || video.currentSrc,
          confidence: 0.9,
          method: `player_search:descendant:${selector}`,
        };
      }
    }

    return {
      type: "none",
      element: null,
      confidence: 0,
      method: "not_found",
    };
  } catch (error) {
    logger.error("[MediaClickDetector] Media detection failed:", error);
    return {
      type: "none",
      element: null,
      confidence: 0,
      method: "error",
    };
  }
}

/**
 * Find exact media element at click coordinates
 */
export function findMediaAtCoordinates(
  x: number,
  y: number,
): MediaDetectionResult {
  try {
    const elementAtPoint = document.elementFromPoint(
      x,
      y,
    ) as HTMLElement | null;
    if (!elementAtPoint) {
      return {
        type: "none",
        element: null,
        confidence: 0,
        method: "no_element_at_point",
      };
    }

    return detectMediaFromClick(elementAtPoint);
  } catch (error) {
    logger.error(
      "[MediaClickDetector] Coordinate-based detection failed:",
      error,
    );
    return {
      type: "none",
      element: null,
      confidence: 0,
      method: "coordinate_error",
    };
  }
}

function isTwitterMediaElement(element: HTMLElement): boolean {
  if (element.tagName === "IMG") {
    // Phase 153: Support link preview images
    // IMG elements are all considered processable. Further validation happens
    // in the STABLE_SELECTORS filter and DOM backup strategy layers (filters real media only)
    return true;
  }

  if (element.tagName === "VIDEO") {
    return !!element.closest(STABLE_SELECTORS.MEDIA_PLAYERS.join(", "));
  }

  return false;
}
