import { logger } from '@shared/logging';
import { normalizeMediaUrl } from '@shared/media/media-utils';
import type { MediaInfo } from '@shared/types/media.types';

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
      if (item.thumbnailUrl && normalizeMediaUrl(item.thumbnailUrl) === normalizedElementUrl) {
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
    logger.warn('[determineClickedIndex] Error calculating clicked index:', error);
    return 0;
  }
}

const MAX_ASCENT_DEPTH = 4;

function findMediaElement(element: HTMLElement): HTMLElement | null {
  // 1. Self check
  if (element.tagName === 'IMG' || element.tagName === 'VIDEO') {
    return element;
  }

  // 2. Check for media within the element (any depth)
  const mediaChild = element.querySelector('img, video');
  if (mediaChild) {
    return mediaChild as HTMLElement;
  }

  // 3. Walk up ancestors and inspect sibling branches
  let branch: HTMLElement | null = element;
  for (let depth = 0; depth < MAX_ASCENT_DEPTH && branch; depth++) {
    const ancestor: HTMLElement | null = branch.parentElement;
    if (!ancestor) {
      break;
    }

    const siblingMedia = findMediaInSiblingBranches(ancestor, branch);
    if (siblingMedia) {
      return siblingMedia;
    }

    branch = ancestor;
  }

  return null;
}

function findMediaInSiblingBranches(
  ancestor: HTMLElement,
  exclude: HTMLElement
): HTMLElement | null {
  for (const sibling of Array.from(ancestor.children)) {
    if (sibling === exclude) {
      continue;
    }

    if (sibling instanceof HTMLElement) {
      if (sibling.tagName === 'IMG' || sibling.tagName === 'VIDEO') {
        return sibling;
      }

      const descendantMedia = sibling.querySelector('img, video');
      if (descendantMedia) {
        return descendantMedia as HTMLElement;
      }
    }
  }

  return null;
}

function extractMediaUrl(element: HTMLElement): string | null {
  if (element.tagName === 'IMG') {
    return element.getAttribute('src');
  }
  if (element.tagName === 'VIDEO') {
    return element.getAttribute('poster') || element.getAttribute('src');
  }
  return null;
}
