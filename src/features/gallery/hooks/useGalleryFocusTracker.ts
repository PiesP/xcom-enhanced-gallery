/**
 * @fileoverview Gallery Focus Tracker Hook
 * @description Tracks which gallery item should be focused based on scroll position.
 * Uses FocusCoordinator with IntersectionObserver for visibility detection.
 *
 * Key behaviors:
 * - Tracks items via IntersectionObserver
 * - Supports manual focus (click, keyboard) vs auto-focus (scroll)
 * - Updates global gallery state for toolbar sync
 *
 * Note: Does NOT trigger auto-scroll. Tracking only.
 */

import { FocusCoordinator } from '@features/gallery/logic/focus-coordinator';
import { getSolid } from '@shared/external/vendors';
import {
  gallerySignals,
  navigateToItem,
  setFocusedIndex,
} from '@shared/state/signals/gallery.signals';
import { toAccessor } from '@shared/utils/solid/solid-helpers';
import type { Accessor } from 'solid-js';

type MaybeAccessor<T> = T | Accessor<T>;

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
  /** Force immediate recomputation (bypasses debounce) */
  forceSync: () => void;
  /** Set or clear manual focus */
  setManualFocus: (index: number | null) => void;
  /** Apply focus after navigation */
  applyFocusAfterNavigation: (index: number) => void;
}

const { createSignal, onCleanup } = getSolid();

/**
 * Track gallery item focus based on scroll position.
 * Uses IntersectionObserver for efficient visibility detection.
 */
export function useGalleryFocusTracker(
  options: UseGalleryFocusTrackerOptions,
): UseGalleryFocusTrackerReturn {
  const [manualFocusIndex, setManualFocusIndex] = createSignal<number | null>(null);

  const isEnabled = toAccessor(options.isEnabled);
  const container = toAccessor(options.container);

  const coordinator = new FocusCoordinator({
    isEnabled: () => isEnabled() && manualFocusIndex() === null,
    container,
    ...(options.threshold !== undefined && { threshold: options.threshold }),
    rootMargin: options.rootMargin ?? '0px',
    onFocusChange: (index, source) => {
      if (source === 'auto' && manualFocusIndex() === null && index !== null) {
        // 'auto-focus' source prevents auto-scroll in navigation handler
        navigateToItem(index, 'scroll', 'auto-focus');
      }
    },
  });

  onCleanup(() => coordinator.cleanup());

  const setFocus = (index: number): void => {
    setManualFocusIndex(index);
    setFocusedIndex(index);
  };

  const setManualFocus = (index: number | null): void => {
    setManualFocusIndex(index);
    if (index !== null) setFocus(index);
  };

  return {
    focusedIndex: () => gallerySignals.focusedIndex.value,
    registerItem: (index, element) => coordinator.registerItem(index, element),
    handleItemFocus: setFocus,
    handleItemBlur: (index: number) => {
      if (manualFocusIndex() === index) setManualFocusIndex(null);
    },
    forceSync: () => coordinator.updateFocus(),
    setManualFocus,
    applyFocusAfterNavigation: setFocus,
  };
}
