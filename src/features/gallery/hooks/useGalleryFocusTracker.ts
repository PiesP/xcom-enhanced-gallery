/**
 * @fileoverview Gallery Focus Tracker Hook
 * @description Tracks which gallery item should be focused based on scroll position.
 * Uses FocusCoordinator with IntersectionObserver for efficient visibility detection.
 *
 * Key behaviors:
 * - Registers/unregisters items with FocusCoordinator
 * - Handles manual focus from user interactions (click, keyboard)
 * - Processes auto-focus from scroll position changes
 * - Updates toolbar progress via global state
 *
 * Note: Does NOT trigger auto-scroll. Tracking only.
 */

import { FocusCoordinator } from '@features/gallery/logic/focus-coordinator';
import { getSolid } from '@shared/external/vendors';
import { navigateToItem, setFocusedIndex } from '@shared/state/signals/gallery.signals';
import { toAccessor } from '@shared/utils/solid/solid-helpers';
import type { Accessor } from 'solid-js';

type MaybeAccessor<T> = T | Accessor<T>;

/** Navigation trigger source */
type FocusNavigationTrigger = 'button' | 'click' | 'keyboard' | 'init' | 'scroll';

/** Hook configuration */
export interface UseGalleryFocusTrackerOptions {
  /** Container element for tracking */
  container: MaybeAccessor<HTMLElement | null>;
  /** Whether tracking is enabled */
  isEnabled: MaybeAccessor<boolean>;
  /** IntersectionObserver threshold (default: 0) */
  threshold?: number | number[];
  /** IntersectionObserver root margin (default: '0px') */
  rootMargin?: string;
  /** Minimum visible ratio (default: 0.05) */
  minimumVisibleRatio?: number;
  /** Auto-focus debounce time in ms (default: 50) */
  autoFocusDebounce?: MaybeAccessor<number>;
}

/** Hook return type */
export interface UseGalleryFocusTrackerReturn {
  /** Current focused index (null if none) */
  focusedIndex: Accessor<number | null>;
  /** Register item for tracking */
  registerItem: (index: number, element: HTMLElement | null) => void;
  /** Handle manual focus (user click/interaction) */
  handleItemFocus: (index: number) => void;
  /** Handle blur from item */
  handleItemBlur: (index: number) => void;
  /** Force recomputation */
  forceSync: () => void;
  /** Set manual focus programmatically */
  setManualFocus: (index: number | null) => void;
  /** Apply focus after navigation */
  applyFocusAfterNavigation: (
    index: number,
    trigger: FocusNavigationTrigger,
    options?: { force?: boolean },
  ) => void;
}

const { createSignal, onCleanup, batch } = getSolid();

/**
 * Track gallery item focus based on scroll position.
 * Uses IntersectionObserver for efficient visibility detection.
 */
export function useGalleryFocusTracker(
  options: UseGalleryFocusTrackerOptions,
): UseGalleryFocusTrackerReturn {
  const [focusedIndex, setLocalFocusedIndex] = createSignal<number | null>(null);
  const [manualFocusIndex, setManualFocusIndex] = createSignal<number | null>(null);

  const isEnabled = toAccessor(options.isEnabled);
  const container = toAccessor(options.container);
  const autoFocusDebounce = toAccessor(options.autoFocusDebounce ?? 50);

  const coordinator = new FocusCoordinator({
    isEnabled: () => isEnabled() && manualFocusIndex() === null,
    container,
    threshold: options.threshold ?? 0,
    rootMargin: options.rootMargin ?? '0px',
    ...(options.minimumVisibleRatio !== undefined && {
      minimumVisibleRatio: options.minimumVisibleRatio,
    }),
    debounceTime: autoFocusDebounce(),
    onFocusChange: (index, source) => {
      if (source === 'auto' && manualFocusIndex() === null) {
        batch(() => {
          setLocalFocusedIndex(index);
          if (index !== null) {
            // 'auto-focus' source prevents auto-scroll in navigation handler
            navigateToItem(index, 'scroll', 'auto-focus');
          }
        });
      }
    },
  });

  onCleanup(() => coordinator.cleanup());

  const registerItem = (index: number, element: HTMLElement | null): void => {
    coordinator.registerItem(index, element);
  };

  const handleItemFocus = (index: number): void => {
    setManualFocusIndex(index);
    setLocalFocusedIndex(index);
    setFocusedIndex(index);
  };

  const handleItemBlur = (index: number): void => {
    if (manualFocusIndex() === index) {
      setManualFocusIndex(null);
    }
  };

  const setManualFocus = (index: number | null): void => {
    setManualFocusIndex(index);
    if (index !== null) {
      setLocalFocusedIndex(index);
      setFocusedIndex(index);
    }
  };

  const applyFocusAfterNavigation = (
    index: number,
    _trigger: FocusNavigationTrigger,
    _opts?: { force?: boolean },
  ): void => {
    setManualFocus(index);
  };

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
