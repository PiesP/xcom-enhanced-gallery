/**
 * @fileoverview MediaClickDetector - Robust media click detector
 * @description Stable media click detection and handling logic with DOM caching optimization
 */

import { CSS } from "@/constants/css";
import { SELECTORS } from "@/constants/selectors";
import { isVideoControlElement } from "@shared/dom/utils";
import { logger } from "@shared/logging";
import { gallerySignals } from "@shared/state/signals/gallery.signals";
import { isValidMediaUrl } from "@shared/utils/url/validator";

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

// Essential selectors for X.com
const ESSENTIAL_SELECTORS = {
  TWEET: SELECTORS.TWEET,
  TWEET_PHOTO: SELECTORS.TWEET_PHOTO,
  VIDEO_PLAYER: SELECTORS.VIDEO_PLAYER,
  MEDIA_LINK: 'a[href*="/status/"]',
} as const;

/**
 * Check if element is processable media
 */
export function isProcessableMedia(target: HTMLElement | null): boolean {
  if (!target) return false;

  // 1. Global blocks
  if (gallerySignals.isOpen.value) return false;
  if (shouldBlockMediaTrigger(target)) return false;

  // 2. Direct media check (Fastest)
  if (target.tagName === "IMG" || target.tagName === "VIDEO") {
    if (isTwitterMediaElement(target)) return true;
  }

  // 3. Container check (Event Delegation style)
  // Check if we are inside a known media container
  if (
    target.closest(ESSENTIAL_SELECTORS.TWEET_PHOTO) ||
    target.closest(ESSENTIAL_SELECTORS.VIDEO_PLAYER)
  ) {
    return true;
  }

  // 4. Tweet context check
  // If inside a tweet, check if we clicked near media (legacy behavior support, but simplified)
  const tweet = target.closest(ESSENTIAL_SELECTORS.TWEET);
  if (tweet) {
    // If we are in a tweet, and we haven't been blocked by shouldBlockMediaTrigger,
    // and we are clicking on something that looks like a media container wrapper
    // This is a heuristic. For now, let's rely on the explicit media container check above.
    // If the user clicks on the "background" of a media grid, it might be handled here.

    // Simplified: Only allow if we hit a media container explicitly.
    // The previous logic had "isNearMedia" which is expensive (getBoundingClientRect).
    // We will remove it for performance unless strictly necessary.
    return false;
  }

  return false;
}

export function shouldBlockMediaTrigger(target: HTMLElement | null): boolean {
  if (!target) return false;

  // 1. Allow video controls
  if (isVideoControlElement(target)) return true; // Block gallery, allow control

  // 2. Block internal gallery elements
  if (
    target.closest(CSS.SELECTORS.ROOT) ||
    target.closest(CSS.SELECTORS.OVERLAY)
  )
    return true;

  // 3. Block interactive elements (Buttons, Links)
  // We check for interactive elements up the tree
  const interactive = target.closest(
    'button, a, [role="button"], [data-testid="like"], [data-testid="retweet"], [data-testid="reply"], [data-testid="share"], [data-testid="bookmark"]',
  );

  if (interactive) {
    // Exception: Media Links (links that wrap media or point to media)
    // If the link IS the media container or contains it, we might want to allow it.
    // But usually, clicking a link navigates. We want to intercept navigation ONLY if it's a media click.

    // If it's a link to a status (tweet), and it contains media, we might want to open gallery.
    // But X.com usually puts the media in a separate div/a.

    const isMediaLink =
      interactive.matches(ESSENTIAL_SELECTORS.MEDIA_LINK) ||
      interactive.querySelector(ESSENTIAL_SELECTORS.TWEET_PHOTO) ||
      interactive.querySelector(ESSENTIAL_SELECTORS.VIDEO_PLAYER);

    if (isMediaLink) {
      // If it's a media link, we DON'T block (return false) so isProcessableMedia can return true.
      // But wait, isProcessableMedia checks this function first.
      // If this returns true, isProcessableMedia returns false (blocked).

      // So if it IS a media link, we should return FALSE (don't block).
      return false;
    }

    return true; // Block other interactive elements
  }

  return false;
}

/**
 * Extract media information from clicked element
 */
export function detectMediaFromClick(
  target: HTMLElement,
): MediaDetectionResult {
  try {
    // 1. Direct Element
    if (target.tagName === "IMG" && isTwitterMediaElement(target)) {
      return createResult(
        "image",
        target,
        (target as HTMLImageElement).src,
        1.0,
        "direct",
      );
    }
    if (target.tagName === "VIDEO" && isTwitterMediaElement(target)) {
      const v = target as HTMLVideoElement;
      return createResult(
        "video",
        target,
        v.src || v.currentSrc,
        1.0,
        "direct",
      );
    }

    // 2. Container Search (Upwards)
    const photoContainer = target.closest(ESSENTIAL_SELECTORS.TWEET_PHOTO);
    if (photoContainer) {
      const img = photoContainer.querySelector("img");
      if (img && isTwitterMediaElement(img)) {
        return createResult("image", img, img.src, 0.9, "container");
      }
    }

    const videoContainer = target.closest(ESSENTIAL_SELECTORS.VIDEO_PLAYER);
    if (videoContainer) {
      const video = videoContainer.querySelector("video");
      if (video) {
        return createResult(
          "video",
          video,
          video.src || video.currentSrc,
          0.9,
          "container",
        );
      }
    }

    return createResult("none", null, "", 0, "not_found");
  } catch (error) {
    logger.error("[MediaClickDetector] Media detection failed:", error);
    return createResult("none", null, "", 0, "error");
  }
}

function createResult(
  type: "video" | "image" | "none",
  element: HTMLElement | null,
  url: string,
  confidence: number,
  method: string,
): MediaDetectionResult {
  return { type, element, mediaUrl: url, confidence, method };
}

/**
 * Check if element is a valid Twitter media element
 */
function isTwitterMediaElement(element: HTMLElement): boolean {
  if (element.tagName === "IMG") {
    const src = (element as HTMLImageElement).src;
    return isValidMediaUrl(src);
  }
  if (element.tagName === "VIDEO") {
    const src =
      (element as HTMLVideoElement).src ||
      (element as HTMLVideoElement).currentSrc;
    if (src.startsWith("blob:")) return true;
    return isValidMediaUrl(src);
  }
  return false;
}
