// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Navigation handlers hook — provides click/event handlers
 * for gallery navigation (previous/next), background click to close,
 * and media item click navigation.
 */

import { CSS } from '@constants/css';
import { navigateToItem } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import type { JSX } from 'solid-js';

/**
 * Wraps a DOM state change in startViewTransition if supported.
 * Progressive enhancement — falls through to direct call when unavailable.
 */
function withViewTransition(update: () => void): void {
  if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
    void document.startViewTransition(() => {
      update();
    });
  } else {
    update();
  }
}

/**
 * Parameters for useGalleryNavigationHandlers hook
 */
interface UseGalleryNavigationHandlersOptions {
  /** Current active media index (last explicitly navigated to) */
  readonly currentIndex: () => number;
  /**
   * Focus-tracked index from IntersectionObserver.
   * When non-null and in-bounds, prev/next buttons navigate relative
   * to this index (what the user is actually looking at) instead of
   * currentIndex. Falls back to currentIndex when null.
   */
  readonly focusedIndex?: (() => number | null) | undefined;
  /** Gallery media items array (used for bounds checking) */
  readonly mediaItems: () => readonly MediaInfo[];
  /** Callback invoked when background is clicked (gallery close) */
  readonly onClose: () => void;
}

/**
 * Return value for useGalleryNavigationHandlers hook
 */
interface UseGalleryNavigationHandlersResult {
  /** Navigate to the previous item (decrement index) */
  readonly handlePrevious: () => void;
  /** Navigate to the next item (increment index) */
  readonly handleNext: () => void;
  /** Handle click on the gallery background — closes the gallery */
  readonly handleBackgroundClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>;
  /** Handle click on a specific media item — navigates to it */
  readonly handleMediaItemClick: (index: number) => void;
}

/**
 * Provides event handlers for gallery navigation actions.
 * Handles boundary checking, background click dismissal, and
 * media item click navigation via the shared navigateToItem function.
 *
 * @param options - Hook configuration with state accessors and close callback
 * @returns Navigation handler functions
 */
export function useGalleryNavigationHandlers(
  options: UseGalleryNavigationHandlersOptions
): UseGalleryNavigationHandlersResult {
  const { currentIndex, focusedIndex, mediaItems, onClose } = options;

  /**
   * Returns the index to use as the navigation anchor for prev/next buttons.
   * Prefers focusedIndex (what the user is actually looking at via
   * IntersectionObserver) over currentIndex (last explicitly navigated to).
   * Falls back to currentIndex when focusedIndex is null or out of bounds.
   */
  const resolveNavAnchor = (): number => {
    const focus = focusedIndex?.() ?? null;
    const items = mediaItems();
    if (typeof focus === 'number' && focus >= 0 && focus < items.length) {
      return focus;
    }
    return currentIndex();
  };

  const handlePrevious = () => {
    const anchor = resolveNavAnchor();
    if (anchor > 0) {
      withViewTransition(() => navigateToItem(anchor - 1, 'button'));
    }
  };

  const handleNext = () => {
    const anchor = resolveNavAnchor();
    const items = mediaItems();
    if (anchor < items.length - 1) {
      withViewTransition(() => navigateToItem(anchor + 1, 'button'));
    }
  };

  const handleBackgroundClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    // Ignore clicks on interactive gallery elements (toolbar, items, panels).
    // Uses GALLERY_ELEMENT_SELECTORS — intentionally excludes overlay/container
    // so that clicks on the gallery background ARE treated as close triggers.
    if (CSS.GALLERY_ELEMENT_SELECTORS.some((sel) => target.closest(sel))) {
      return;
    }

    // Close gallery when clicking on background area (outside items and toolbar)
    onClose();
  };

  const handleMediaItemClick = (index: number) => {
    const items = mediaItems();
    const current = currentIndex();

    if (index >= 0 && index < items.length && index !== current) {
      withViewTransition(() => navigateToItem(index, 'scroll'));
    }
  };

  return {
    handlePrevious,
    handleNext,
    handleBackgroundClick,
    handleMediaItemClick,
  };
}
