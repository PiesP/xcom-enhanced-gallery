// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Navigation handlers hook — provides click/event handlers
 * for gallery navigation (previous/next), background click to close,
 * and media item click navigation.
 */

import { CSS } from '@constants/css';
import {
  navigateNext,
  navigatePrevious,
  navigateToItem,
} from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { withTrustedEvent } from '@shared/utils/events/trusted-event';
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
  const { mediaItems, onClose } = options;

  const handlePrevious = () => {
    withViewTransition(() => navigatePrevious('button'));
  };

  const handleNext = () => {
    withViewTransition(() => navigateNext('button'));
  };

  const handleBackgroundClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = withTrustedEvent(
    (event: MouseEvent) => {
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
    }
  );

  const handleMediaItemClick = (index: number) => {
    const items = mediaItems();

    if (index >= 0 && index < items.length) {
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
