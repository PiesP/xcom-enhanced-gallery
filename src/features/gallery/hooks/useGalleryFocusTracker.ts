/**
 * @fileoverview Gallery Focus Tracker Hook
 * @description Tracks which gallery item should be focused based on scroll position.
 * Coordinates with FocusCoordinator for IntersectionObserver-based tracking.
 *
 * Key responsibilities:
 * - Register/unregister gallery items with FocusCoordinator
 * - Handle manual focus from user interactions (click, keyboard)
 * - Process auto-focus changes from scroll position
 * - Update global gallery state (focusedIndex, currentIndex)
 *
 * Note: This hook does NOT trigger auto-scroll. It only tracks focus.
 */

import { FocusCoordinator } from '@features/gallery/logic/focus-coordinator';
import { getSolid } from '@shared/external/vendors';
import { navigateToItem, setFocusedIndex } from '@shared/state/signals/gallery.signals';
import { toAccessor } from '@shared/utils/solid/solid-helpers';
import type { Accessor } from 'solid-js';

type MaybeAccessor<T> = T | Accessor<T>;

/** Navigation trigger source types */
type FocusNavigationTrigger = 'button' | 'click' | 'keyboard' | 'init' | 'scroll';

/** Configuration options for useGalleryFocusTracker */
export interface UseGalleryFocusTrackerOptions {
  /** Container element for focus tracking */
  container: MaybeAccessor<HTMLElement | null>;
  /** Whether focus tracking is enabled */
  isEnabled: MaybeAccessor<boolean>;
  /** Current gallery index accessor */
  getCurrentIndex: Accessor<number>;
  /** IntersectionObserver threshold(s) */
  threshold?: number | number[];
  /** IntersectionObserver root margin */
  rootMargin?: string;
  /** Minimum visible ratio to consider an item */
  minimumVisibleRatio?: number;
  /** Debounce time for auto-focus updates (ms) */
  autoFocusDebounce?: MaybeAccessor<number>;
}

/** Return type for useGalleryFocusTracker */
export interface UseGalleryFocusTrackerReturn {
  /** Currently focused item index (null if none) */
  focusedIndex: Accessor<number | null>;
  /** Register an item element for focus tracking */
  registerItem: (index: number, element: HTMLElement | null) => void;
  /** Handle manual focus on an item (from user click/interaction) */
  handleItemFocus: (index: number) => void;
  /** Handle blur from an item */
  handleItemBlur: (index: number) => void;
  /** Force recomputation of focused item */
  forceSync: () => void;
  /** Set manual focus (bypasses auto-focus) */
  setManualFocus: (index: number | null) => void;
  /** Apply focus after navigation completes */
  applyFocusAfterNavigation: (
    index: number,
    trigger: FocusNavigationTrigger,
    options?: { force?: boolean },
  ) => void;
}

const { createSignal, onCleanup, batch } = getSolid();

/**
 * Hook for tracking gallery item focus based on scroll position.
 * Uses IntersectionObserver to efficiently detect which item is most visible.
 */
export function useGalleryFocusTracker(
  options: UseGalleryFocusTrackerOptions,
): UseGalleryFocusTrackerReturn {
  const [focusedIndex, setLocalFocusedIndex] = createSignal<number | null>(null);
  const [manualFocusIndex, setManualFocusIndex] = createSignal<number | null>(null);

  const isEnabled = toAccessor(options.isEnabled);
  const container = toAccessor(options.container);
  const autoFocusDebounce = toAccessor(options.autoFocusDebounce ?? 50);

  // FocusCoordinator handles IntersectionObserver and focus computation
  const coordinator = new FocusCoordinator({
    // Disable auto-focus when manual focus is active
    isEnabled: () => isEnabled() && manualFocusIndex() === null,
    container,
    threshold: options.threshold ?? 0,
    rootMargin: options.rootMargin ?? '0px',
    ...(options.minimumVisibleRatio !== undefined && {
      minimumVisibleRatio: options.minimumVisibleRatio,
    }),
    debounceTime: autoFocusDebounce(),
    onFocusChange: (index, source) => {
      // Only process auto-focus when no manual focus is active
      if (source === 'auto' && manualFocusIndex() === null) {
        batch(() => {
          setLocalFocusedIndex(index);
          if (index !== null) {
            // Update global state - triggers toolbar progress update
            // Note: 'auto-focus' source prevents auto-scroll in navigation handler
            navigateToItem(index, 'scroll', 'auto-focus');
          }
        });
      }
    },
  });

  onCleanup(() => coordinator.cleanup());

  /** Register an item element for focus tracking */
  const registerItem = (index: number, element: HTMLElement | null): void => {
    coordinator.registerItem(index, element);
  };

  /** Handle manual focus from user interaction */
  const handleItemFocus = (index: number): void => {
    setManualFocusIndex(index);
    setLocalFocusedIndex(index);
    setFocusedIndex(index);
  };

  /** Handle blur - clears manual focus if it was the focused item */
  const handleItemBlur = (index: number): void => {
    if (manualFocusIndex() === index) {
      setManualFocusIndex(null);
    }
  };

  /** Set manual focus directly (for programmatic control) */
  const setManualFocus = (index: number | null): void => {
    setManualFocusIndex(index);
    if (index !== null) {
      setLocalFocusedIndex(index);
      setFocusedIndex(index);
    }
  };

  /** Apply focus after navigation completes */
  const applyFocusAfterNavigation = (
    index: number,
    _trigger: FocusNavigationTrigger,
    _opts?: { force?: boolean },
  ): void => {
    setManualFocus(index);
  };

  /** Force recomputation of focused item */
  const forceSync = (): void => {
    coordinator.recompute();
  };

  return {
    focusedIndex,
    registerItem,
    handleItemFocus,
    handleItemBlur,
    forceSync,
    setManualFocus,
    applyFocusAfterNavigation,
  };
}
