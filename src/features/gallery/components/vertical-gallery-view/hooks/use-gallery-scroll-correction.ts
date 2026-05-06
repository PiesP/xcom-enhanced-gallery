/**
 * @fileoverview Scroll correction hook — debounces scroll position adjustment
 * after media items load, ensuring smooth visual corrections without
 * disrupting the user's current view.
 */

import { createDebounced } from '@shared/async/debounce';
import { onCleanup } from 'solid-js';

/**
 * Parameters for useGalleryScrollCorrection hook
 */
interface UseGalleryScrollCorrectionOptions {
  /** Whether the gallery is currently visible */
  readonly isVisible: () => boolean;
  /** Current active media index */
  readonly currentIndex: () => number;
  /** Currently active media item (with id) */
  readonly activeMedia: () => { readonly id: string } | null;
  /** Scroll the container to the given item index */
  readonly scrollToItem: (index: number) => void;
}

/**
 * Return value for useGalleryScrollCorrection hook
 */
interface UseGalleryScrollCorrectionResult {
  /**
   * Debounced scroll correction — call this when a media item finishes loading.
   * Only corrects if the item is still the active one after the debounce delay.
   */
  readonly debouncedScrollCorrection: (index: number, mediaId: string) => void;
}

/**
 * Creates a debounced scroll correction that delays scroll position adjustment
 * after media load events. This prevents jarring scroll jumps when media
 * items load asynchronously and change the layout.
 *
 * @param options - Hook configuration with state accessors and scroll handler
 * @returns Object containing the debounced scroll correction function
 */
export function useGalleryScrollCorrection(
  options: UseGalleryScrollCorrectionOptions
): UseGalleryScrollCorrectionResult {
  const { isVisible, currentIndex, activeMedia, scrollToItem } = options;

  const debouncedScrollCorrection = createDebounced((index: number, mediaId: string) => {
    if (!isVisible()) {
      return;
    }

    if (index !== currentIndex() || activeMedia()?.id !== mediaId) {
      return;
    }

    scrollToItem(index);
  }, 120);

  onCleanup(() => {
    debouncedScrollCorrection.cancel();
  });

  return {
    debouncedScrollCorrection,
  };
}
