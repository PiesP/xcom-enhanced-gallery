/**
 * @fileoverview Gallery navigation hook
 * @description Manages navigation event handling and related state
 * @module features/gallery/components/vertical-gallery-view/hooks/useGalleryNavigation
 * @version 1.0.0
 */

import { getSolid } from '@shared/external/vendors';
import type { NavigationTrigger } from '@shared/state/machines/navigation.machine';
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
  options: UseGalleryNavigationOptions
): UseGalleryNavigationResult {
  const { isVisible, scrollToItem } = options;

  const [lastNavigationTrigger, setLastNavigationTrigger] = createSignal<string | null>(null);
  const [programmaticScrollTimestamp, setProgrammaticScrollTimestamp] = createSignal(0);

  // Single unified effect for navigation events
  createEffect(() => {
    if (!isVisible()) return;

    const unsubscribes: Array<() => void> = [];

    const handleNavigateStart = ({ trigger }: { trigger: NavigationTrigger }) => {
      setLastNavigationTrigger(trigger);
    };

    const handleNavigateComplete = ({
      index,
      trigger,
    }: {
      index: number;
      trigger: NavigationTrigger;
    }) => {
      setLastNavigationTrigger(trigger);

      // Skip auto-scroll for scroll-based navigation
      // When user manually scrolls, focus updates but we shouldn't trigger additional scroll
      if (trigger === 'scroll') {
        return;
      }

      // Perform scroll only for button/keyboard/click navigation
      scrollToItem(index);
    };

    unsubscribes.push(
      galleryIndexEvents.on('navigate:start', handleNavigateStart),
      galleryIndexEvents.on('navigate:complete', handleNavigateComplete)
    );

    onCleanup(() => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    });
  });

  return {
    lastNavigationTrigger,
    setLastNavigationTrigger,
    programmaticScrollTimestamp,
    setProgrammaticScrollTimestamp,
  };
}
