/**
 * @fileoverview Gallery navigation hook
 * @description Manages navigation event handling and related state
 * @module features/gallery/components/vertical-gallery-view/hooks/useGalleryNavigation
 * @version 1.0.0
 */

import { getSolid } from '@shared/external/vendors';
import { galleryIndexEvents } from '@shared/state/signals/gallery.signals';

const { createSignal, createEffect, onCleanup } = getSolid();

/**
 * Options for gallery navigation hook
 */
export interface UseGalleryNavigationOptions {
  /** Whether gallery is visible */
  readonly isVisible: () => boolean;
  /** Callback to scroll to specific item */
  readonly scrollToItem: (index: number) => void;
  /** Callback to apply focus after navigation */
  readonly applyFocusAfterNavigation: (index: number) => void;
}

/**
 * Result of gallery navigation hook
 */
export interface UseGalleryNavigationResult {
  /** Last navigation trigger type */
  readonly lastNavigationTrigger: () => string | null;
  /** Setter for last navigation trigger */
  readonly setLastNavigationTrigger: (trigger: string | null) => void;
  /** Programmatic scroll timestamp */
  readonly programmaticScrollTimestamp: () => number;
  /** Setter for programmatic scroll timestamp */
  readonly setProgrammaticScrollTimestamp: (timestamp: number) => void;
}

/**
 * Hook to manage gallery navigation events
 *
 * Consolidated responsibilities:
 * - Track navigation trigger source (keyboard, click, scroll)
 * - Handle navigation completion events
 * - Manage programmatic scroll timestamps
 *
 * @param options - Hook configuration
 * @returns Navigation state accessors
 */
export function useGalleryNavigation(
  options: UseGalleryNavigationOptions,
): UseGalleryNavigationResult {
  const { isVisible, scrollToItem, applyFocusAfterNavigation } = options;

  const [lastNavigationTrigger, setLastNavigationTrigger] = createSignal<string | null>(null);
  const [programmaticScrollTimestamp, setProgrammaticScrollTimestamp] = createSignal(0);

  // Single unified effect for navigation events
  createEffect(() => {
    if (!isVisible()) return;

    const unsubscribe = galleryIndexEvents.on('navigate:complete', ({ index, trigger }) => {
      // Update trigger state
      setLastNavigationTrigger(trigger);

      // Perform scroll and focus
      scrollToItem(index);
      applyFocusAfterNavigation(index);
    });

    onCleanup(() => unsubscribe());
  });

  return {
    lastNavigationTrigger,
    setLastNavigationTrigger,
    programmaticScrollTimestamp,
    setProgrammaticScrollTimestamp,
  };
}
