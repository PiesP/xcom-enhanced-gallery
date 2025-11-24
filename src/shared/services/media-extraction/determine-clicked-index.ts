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
    const mediaElement = findMediaElement(clickedElement);
    if (!mediaElement) return 0;

    const elementUrl = extractMediaUrl(mediaElement);
    if (!elementUrl) return 0;

    const normalizedElementUrl = normalizeMediaUrl(elementUrl);
    if (!normalizedElementUrl) return 0;

    const index = mediaItems.findIndex((item, i) => {
      if (!item) return false;

      // Check main URL
      const itemUrl = item.url || item.originalUrl;
      if (itemUrl && normalizeMediaUrl(itemUrl) === normalizedElementUrl) {
        logger.debug(
          `[determineClickedIndex] Matched clicked media at index ${i}: ${normalizedElementUrl}`,
        );
        return true;
      }

      // Check thumbnail URL
      if (
        item.thumbnailUrl &&
        normalizeMediaUrl(item.thumbnailUrl) === normalizedElementUrl
      ) {
        logger.debug(
          `[determineClickedIndex] Matched clicked media (thumbnail) at index ${i}: ${normalizedElementUrl}`,
        );
        return true;
      }

      return false;
    });

    if (index !== -1) return index;

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
  // 1. Self check
  if (element.tagName === "IMG" || element.tagName === "VIDEO") {
    return element;
  }

  // 2. Check for media within the element (e.g. wrapper)
  const mediaChild = element.querySelector("img, video");
  if (mediaChild) {
    return mediaChild as HTMLElement;
  }

  // 3. Check ancestors and their immediate media children (siblings/cousins)
  let current = element.parentElement;
  // Limit traversal to avoid performance issues and false positives
  for (let i = 0; i < 3 && current; i++) {
    const siblingMedia = current.querySelector(":scope > img, :scope > video");
    if (siblingMedia) {
      return siblingMedia as HTMLElement;
    }
    current = current.parentElement;
  }

  return null;
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
