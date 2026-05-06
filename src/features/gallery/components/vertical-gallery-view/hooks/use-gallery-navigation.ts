/**
 * @fileoverview Navigation hook: tracks trigger source, coordinates scroll
 * on keyboard/click (not scroll) events. Subscribes only when visible.
 */

import {
  type GalleryNavigateCompletePayload,
  type GalleryNavigateStartPayload,
  galleryIndexEvents,
} from '@shared/state/signals/gallery.signals';
import type { NavigationSource } from '@shared/types/navigation.types';
import type { Accessor } from 'solid-js';
import { createEffect, createSignal, on, onCleanup } from 'solid-js';

type CleanupFn = VoidFunction;

interface UseGalleryNavigationOptions {
  readonly isVisible: () => boolean;
  readonly scrollToItem: (index: number) => void;
}

interface UseGalleryNavigationResult {
  readonly lastNavigationTrigger: Accessor<NavigationSource | null>;
  readonly setLastNavigationTrigger: (trigger: NavigationSource | null) => void;
  readonly programmaticScrollTimestamp: Accessor<number>;
  readonly setProgrammaticScrollTimestamp: (timestamp: number) => void;
}

interface RegisterEventsOptions {
  readonly onTriggerChange: (trigger: NavigationSource) => void;
  readonly onNavigateComplete: (payload: GalleryNavigateCompletePayload) => void;
}

function registerNavigationEvents({
  onTriggerChange,
  onNavigateComplete,
}: RegisterEventsOptions): CleanupFn {
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

export function useGalleryNavigation(
  options: UseGalleryNavigationOptions
): UseGalleryNavigationResult {
  const { isVisible, scrollToItem } = options;

  const [lastNavigationTrigger, setLastNavigationTrigger] = createSignal<NavigationSource | null>(
    null
  );
  const [programmaticScrollTimestamp, setProgrammaticScrollTimestamp] = createSignal(0);

  createEffect(
    on(isVisible, (visible) => {
      if (!visible) return;

      const dispose = registerNavigationEvents({
        onTriggerChange: setLastNavigationTrigger,
        onNavigateComplete: ({ index, trigger }) => {
          if (trigger === 'scroll') return;
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
