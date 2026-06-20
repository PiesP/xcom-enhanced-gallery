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
import { handleGalleryOutsideClick } from '@shared/utils/events/handlers/media-click';
import type { JSX } from 'solid-js';

/**
 * Parameters for useGalleryNavigationHandlers hook
 */
interface UseGalleryNavigationHandlersOptions {
  /** Current active media index */
  readonly currentIndex: () => number;
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
  const { currentIndex, mediaItems, onClose } = options;

  const handlePrevious = () => {
    const current = currentIndex();
    if (current > 0) {
      navigateToItem(current - 1, 'button');
    }
  };

  const handleNext = () => {
    const current = currentIndex();
    const items = mediaItems();
    if (current < items.length - 1) {
      navigateToItem(current + 1, 'button');
    }
  };

  const handleBackgroundClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    // Ignore clicks on interactive gallery elements (toolbar, items, panels).
    if (CSS.GALLERY_ELEMENT_SELECTORS.some((sel) => target.closest(sel))) return;

    // Close gallery when clicking on background area (outside items and toolbar)
    handleGalleryOutsideClick(
      target,
      { onGalleryClose: onClose, onMediaClick: async () => {} },
      event
    );
  };

  const handleMediaItemClick = (index: number) => {
    const items = mediaItems();
    const current = currentIndex();

    if (index >= 0 && index < items.length && index !== current) {
      navigateToItem(index, 'scroll');
    }
  };

  return {
    handlePrevious,
    handleNext,
    handleBackgroundClick,
    handleMediaItemClick,
  };
}
