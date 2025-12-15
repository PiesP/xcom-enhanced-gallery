/**
 * @fileoverview Gallery navigation hook
 * @description Manages navigation event handling and related state
 * @module features/gallery/components/vertical-gallery-view/hooks/useGalleryNavigation
 * @version 1.0.0
 */

import {
  type GalleryNavigateCompletePayload,
  type GalleryNavigateStartPayload,
  galleryIndexEvents,
} from '@shared/state/signals/gallery.signals';
import type { NavigationTrigger } from '@shared/state/signals/navigation.state';
import { createEffect, createSignal, on, onCleanup } from 'solid-js';

type Accessor<T> = () => T;
type Cleanup = () => void;

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
  readonly lastNavigationTrigger: Accessor<NavigationTrigger | null>;
  /** Setter for last navigation trigger */
  readonly setLastNavigationTrigger: (trigger: NavigationTrigger | null) => void;
  /** Programmatic scroll timestamp */
  readonly programmaticScrollTimestamp: Accessor<number>;
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

  const [lastNavigationTrigger, setLastNavigationTrigger] = createSignal<NavigationTrigger | null>(
    null
  );
  const [programmaticScrollTimestamp, setProgrammaticScrollTimestamp] = createSignal(0);

  // Listen for navigation events only while gallery is visible
  createEffect(
    on(isVisible, (visible) => {
      if (!visible) {
        return;
      }

      const dispose = registerNavigationEvents({
        onTriggerChange: setLastNavigationTrigger,
        onNavigateComplete: ({ index, trigger }) => {
          if (trigger === 'scroll') {
            return;
          }

          scrollToItem(index);
        },
      });

      onCleanup(dispose);
    })
  );

  return {
    lastNavigationTrigger,
    setLastNavigationTrigger,
    programmaticScrollTimestamp,
    setProgrammaticScrollTimestamp,
  };
}

interface RegisterNavigationEventsOptions {
  readonly onTriggerChange: (trigger: NavigationTrigger) => void;
  readonly onNavigateComplete: (payload: GalleryNavigateCompletePayload) => void;
}

function registerNavigationEvents({
  onTriggerChange,
  onNavigateComplete,
}: RegisterNavigationEventsOptions): Cleanup {
  const stopStart = galleryIndexEvents.on(
    'navigate:start',
    (payload: GalleryNavigateStartPayload) => onTriggerChange(payload.trigger)
  );

  const stopComplete = galleryIndexEvents.on(
    'navigate:complete',
    (payload: GalleryNavigateCompletePayload) => {
      onTriggerChange(payload.trigger);
      onNavigateComplete(payload);
    }
  );

  return () => {
    stopStart();
    stopComplete();
  };
}
