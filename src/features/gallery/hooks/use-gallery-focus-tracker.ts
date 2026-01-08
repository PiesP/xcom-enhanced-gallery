/**
 * Tracks focused gallery item based on scroll position using IntersectionObserver.
 */

import { FocusCoordinator } from '@features/gallery/logic/focus-coordinator';
import {
  gallerySignals,
  galleryState,
  navigateToItem,
} from '@shared/state/signals/gallery.signals';
import type { MaybeAccessor } from '@shared/utils/solid/accessor-utils';
import { toAccessor } from '@shared/utils/solid/accessor-utils';
import type { Accessor } from 'solid-js';
import { onCleanup } from 'solid-js';

/** Configuration for focus tracking. */
interface UseGalleryFocusTrackerOptions {
  /** Container element for tracking */
  container: MaybeAccessor<HTMLElement | null>;
  /** Whether tracking is enabled */
  isEnabled: MaybeAccessor<boolean>;
  /** Whether user is currently scrolling */
  isScrolling: Accessor<boolean>;
  /** Last navigation trigger */
  lastNavigationTrigger: Accessor<string | null>;
  /** IntersectionObserver threshold (default: 0) */
  threshold?: number | number[];
  /** IntersectionObserver root margin (default: '0px') */
  rootMargin?: string;
}

/** Return type for useGalleryFocusTracker. */
interface UseGalleryFocusTrackerReturn {
  /** Current focused index (null if none) */
  focusedIndex: Accessor<number | null>;
  /** Register item for tracking */
  registerItem: (index: number, element: HTMLElement | null) => void;
  /** Handle manual focus (user click/interaction) */
  handleItemFocus: (index: number) => void;
  /** Force immediate recomputation (bypasses debounce) */
  forceSync: () => void;
}

export function useGalleryFocusTracker(
  options: UseGalleryFocusTrackerOptions
): UseGalleryFocusTrackerReturn {
  const isEnabled = toAccessor(options.isEnabled);
  const container = toAccessor(options.container);
  const isScrolling = options.isScrolling;
  const lastNavigationTrigger = options.lastNavigationTrigger;

  const shouldTrack = () => {
    return isEnabled() && (isScrolling() || lastNavigationTrigger() === 'scroll');
  };

  const coordinator = new FocusCoordinator({
    isEnabled: shouldTrack,
    container,
    activeIndex: () => galleryState.value.currentIndex,
    ...(options.threshold !== undefined && { threshold: options.threshold }),
    rootMargin: options.rootMargin ?? '0px',
    onFocusChange: (index, source) => {
      if (source === 'auto' && index !== null) {
        // 'auto-focus' source prevents auto-scroll in navigation handler
        navigateToItem(index, 'scroll', 'auto-focus');
      }
    },
  });

  onCleanup(() => coordinator.cleanup());

  const handleItemFocus = (index: number): void => {
    // Treat focus event (e.g. Tab) as keyboard navigation
    navigateToItem(index, 'keyboard');
  };

  return {
    focusedIndex: () => gallerySignals.focusedIndex.value,
    registerItem: (index, element) => coordinator.registerItem(index, element),
    handleItemFocus,
    forceSync: () => coordinator.updateFocus(true),
  };
}
