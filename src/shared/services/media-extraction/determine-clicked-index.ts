import { logger } from '@shared/logging';
import type { MediaInfo } from '@shared/types/media.types';
import { normalizeMediaUrl } from '@shared/utils/media/media-dimensions';
import {
  extractMediaUrlFromElement,
  findMediaElementInDOM,
} from '@shared/utils/media/media-element-utils';

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
  mediaItems: MediaInfo[]
): number {
  try {
    const mediaElement = findMediaElementInDOM(clickedElement);
    if (!mediaElement) return 0;

    const elementUrl = extractMediaUrlFromElement(mediaElement);
    if (!elementUrl) return 0;

    const normalizedElementUrl = normalizeMediaUrl(elementUrl);
    if (!normalizedElementUrl) return 0;

    const index = mediaItems.findIndex((item, i) => {
      if (!item) return false;

      // Check main URL
      const itemUrl = item.url || item.originalUrl;
      if (itemUrl && normalizeMediaUrl(itemUrl) === normalizedElementUrl) {
        if (__DEV__) {
          logger.debug(
            `[determineClickedIndex] Matched clicked media at index ${i}: ${normalizedElementUrl}`
          );
        }
        return true;
      }

      // Check thumbnail URL
      if (item.thumbnailUrl && normalizeMediaUrl(item.thumbnailUrl) === normalizedElementUrl) {
        if (__DEV__) {
          logger.debug(
            `[determineClickedIndex] Matched clicked media (thumbnail) at index ${i}: ${normalizedElementUrl}`
          );
        }
        return true;
      }

      return false;
    });

    if (index !== -1) return index;

    if (__DEV__) {
      logger.warn(
        `[determineClickedIndex] No matching media found for URL: ${normalizedElementUrl}, defaulting to 0`
      );
    }
    return 0;
  } catch (error) {
    if (__DEV__) {
      logger.warn('[determineClickedIndex] Error calculating clicked index:', error);
    }
    return 0;
  }
}
