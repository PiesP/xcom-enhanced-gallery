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

const MAX_ANCESTOR_HOPS = 3;
const MAX_DESCENDANT_DEPTH = 6;

function findMediaElement(element: HTMLElement): HTMLElement | null {
  if (isMediaElement(element)) {
    return element;
  }

  const descendant = findMediaDescendant(element, {
    includeRoot: false,
    maxDepth: MAX_DESCENDANT_DEPTH,
  });

  if (descendant) {
    return descendant;
  }

  let branch: HTMLElement | null = element;
  for (let depth = 0; depth < MAX_ANCESTOR_HOPS && branch; depth++) {
    const ancestor: HTMLElement | null = branch.parentElement;
    if (!ancestor) {
      break;
    }

    const ancestorMedia = findMediaDescendant(ancestor, {
      includeRoot: true,
      maxDepth: MAX_DESCENDANT_DEPTH,
    });

    if (ancestorMedia) {
      return ancestorMedia;
    }

    branch = ancestor;
  }

  return null;
}

type DescendantSearchOptions = {
  includeRoot?: boolean;
  maxDepth: number;
};

function findMediaDescendant(
  root: HTMLElement,
  { includeRoot = false, maxDepth }: DescendantSearchOptions
): HTMLElement | null {
  const queue: Array<{ node: HTMLElement; depth: number }> = [{ node: root, depth: 0 }];

  while (queue.length) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    const { node, depth } = current;

    if ((includeRoot || node !== root) && isMediaElement(node)) {
      return node;
    }

    if (depth >= maxDepth) {
      continue;
    }

    for (const child of Array.from(node.children)) {
      if (!(child instanceof HTMLElement)) {
        continue;
      }

      queue.push({ node: child, depth: depth + 1 });
    }
  }

  return null;
}

function isMediaElement(element: HTMLElement): boolean {
  return element.tagName === 'IMG' || element.tagName === 'VIDEO';
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
