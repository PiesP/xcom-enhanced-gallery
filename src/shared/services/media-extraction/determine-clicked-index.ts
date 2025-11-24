import { logger } from "@shared/logging";
import { normalizeMediaUrl } from "@shared/media/media-utils";
import type { MediaInfo } from "@shared/types/media.types";

/**
 * Determine Clicked Media Index
 *
 * Calculates which media item the user clicked on by matching the clicked element's URL
 * against the extracted media items.
 *
 * @param clickedElement - The HTML element the user clicked
 * @param mediaItems - The list of extracted media items
 * @returns The 0-based index of the clicked media item, or 0 if not found
 */
export function determineClickedIndex(
  clickedElement: HTMLElement,
  mediaItems: MediaInfo[],
): number {
  try {
    // 1. Find the actual media element from the click
    const mediaElement = findMediaElement(clickedElement);
    if (!mediaElement) {
      return 0;
    }

    // 2. Extract URL from the element
    const elementUrl = extractMediaUrl(mediaElement);
    if (!elementUrl) {
      return 0;
    }

    // 3. Normalize the URL for comparison
    const normalizedElementUrl = normalizeMediaUrl(elementUrl);
    if (!normalizedElementUrl) {
      return 0;
    }

    // 4. Compare with media items
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      if (!item) continue;
      const itemUrl = item.url || item.originalUrl;
      if (!itemUrl) continue;

      const normalizedItemUrl = normalizeMediaUrl(itemUrl);
      if (normalizedItemUrl === normalizedElementUrl) {
        logger.debug(
          `[determineClickedIndex] Matched clicked media at index ${i}: ${normalizedElementUrl}`,
        );
        return i;
      }

      // Also check thumbnail URL (important for videos where clicked element is poster)
      if (item.thumbnailUrl) {
        const normalizedThumbnailUrl = normalizeMediaUrl(item.thumbnailUrl);
        if (normalizedThumbnailUrl === normalizedElementUrl) {
          logger.debug(
            `[determineClickedIndex] Matched clicked media (thumbnail) at index ${i}: ${normalizedElementUrl}`,
          );
          return i;
        }
      }
    }

    logger.warn(
      `[determineClickedIndex] No matching media found for URL: ${normalizedElementUrl}, defaulting to 0`,
    );
    return 0;
  } catch (error) {
    logger.warn(
      "[determineClickedIndex] Error calculating clicked index:",
      error,
    );
    return 0;
  }
}

function findMediaElement(element: HTMLElement): HTMLElement | null {
  // Level 1: Clicked element is already media?
  if (element.tagName === "IMG" || element.tagName === "VIDEO") {
    return element;
  }

  // Level 2: Direct child is media?
  const mediaChild = element.querySelector(":scope > img, :scope > video");
  if (mediaChild) {
    return mediaChild as HTMLElement;
  }

  // Level 3: Deeper children within depth limit?
  const deepChild = element.querySelector("img, video");
  if (deepChild && isDirectMediaChild(element, deepChild as HTMLElement)) {
    return deepChild as HTMLElement;
  }

  // Level 4: Search parent elements (up to 5 levels)
  let current = element.parentElement;
  for (let i = 0; i < 5 && current; i++) {
    const parentMedia = current.querySelector(":scope > img, :scope > video");
    if (parentMedia) {
      return parentMedia as HTMLElement;
    }
    current = current.parentElement;
  }

  return null;
}

function isDirectMediaChild(parent: HTMLElement, child: HTMLElement): boolean {
  const maxDepth = 3;
  let current: HTMLElement | null = child;

  for (let i = 0; i < maxDepth; i++) {
    if (current === parent) {
      return true;
    }
    current = current.parentElement;
    if (!current) break;
  }
  return false;
}

function extractMediaUrl(element: HTMLElement): string | null {
  if (element.tagName === "IMG") {
    return element.getAttribute("src");
  }
  if (element.tagName === "VIDEO") {
    return element.getAttribute("poster") || element.getAttribute("src");
  }
  return null;
}
