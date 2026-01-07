/**
 * @fileoverview Toolbar auto-hide hook for vertical gallery view
 * @description Manages toolbar visibility with configurable auto-hide timer functionality
 * @module features/gallery/components/vertical-gallery-view/hooks/useToolbarAutoHide
 */

import { getTypedSettingOr } from '@shared/container/settings-access';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import type { Accessor, Setter } from 'solid-js';
import { createEffect, createSignal, onCleanup } from 'solid-js';

/**
 * Configuration options for toolbar auto-hide behavior
 *
 * @property isVisible - Accessor indicating whether the gallery is visible
 * @property hasItems - Accessor indicating whether there are media items to display
 */
interface UseToolbarAutoHideOptions {
  /** Whether the gallery is currently visible */
  readonly isVisible: () => boolean;
  /** Whether there are media items in the gallery */
  readonly hasItems: () => boolean;
}

/**
 * Return value of useToolbarAutoHide hook
 *
 * @property isInitialToolbarVisible - Accessor for toolbar visibility state
 * @property setIsInitialToolbarVisible - Setter function to manually control toolbar visibility
 */
interface UseToolbarAutoHideResult {
  /** Whether toolbar should be initially visible */
  readonly isInitialToolbarVisible: Accessor<boolean>;
  /** Setter for initial toolbar visibility */
  readonly setIsInitialToolbarVisible: Setter<boolean>;
}

/**
 * Custom hook to manage toolbar auto-hide behavior in vertical gallery
 *
 * Manages the initial visibility state of the toolbar with automatic hiding
 * after a configurable delay. The toolbar is shown when the gallery opens
 * and automatically hides based on user settings.
 *
 * Features:
 * - Shows toolbar initially when gallery opens with items
 * - Auto-hides after configurable delay from settings
 * - Respects user-configured delay duration (default: 3000ms)
 * - Properly cleans up timers on component unmount
 * - Handles edge case of zero delay (immediate hide)
 *
 * @param options - Hook configuration with visibility and items accessors
 * @returns Object containing toolbar visibility state accessor and setter
 *
 * @example
 * ```typescript
 * const { isInitialToolbarVisible, setIsInitialToolbarVisible } = useToolbarAutoHide({
 *   isVisible: () => isGalleryOpen(),
 *   hasItems: () => mediaItems().length > 0,
 * });
 * ```
 */
export function useToolbarAutoHide(options: UseToolbarAutoHideOptions): UseToolbarAutoHideResult {
  const { isVisible, hasItems } = options;

  // Compute initial visibility based on gallery state
  const computeInitialVisibility = (): boolean => !!(isVisible() && hasItems());

  // Signal declarations with explicit type
  const [isInitialToolbarVisible, setIsInitialToolbarVisible] = createSignal<boolean>(
    computeInitialVisibility()
  );

  // Track active timer for cleanup
  let activeTimer: number | null = null;

  /**
   * Clears the active auto-hide timer if one exists
   * Sets activeTimer to null after clearing
   */
  const clearActiveTimer = (): void => {
    if (activeTimer === null) {
      return;
    }

    globalTimerManager.clearTimeout(activeTimer);
    activeTimer = null;
  };

  // Effect for managing toolbar visibility and auto-hide timer
  createEffect(() => {
    // Cleanup any existing timer when effect re-runs
    onCleanup(clearActiveTimer);

    // Hide toolbar if gallery is not visible or has no items
    if (!computeInitialVisibility()) {
      setIsInitialToolbarVisible(false);
      return;
    }

    // Show toolbar initially when gallery opens
    setIsInitialToolbarVisible(true);

    // Get auto-hide delay from settings (default: 3000ms)
    const rawAutoHideDelay = getTypedSettingOr('toolbar.autoHideDelay', 3000);
    const autoHideDelay = Math.max(0, typeof rawAutoHideDelay === 'number' ? rawAutoHideDelay : 0);

    // If delay is 0, hide immediately without timer
    if (autoHideDelay === 0) {
      setIsInitialToolbarVisible(false);
      return;
    }

    // Set up auto-hide timer
    activeTimer = globalTimerManager.setTimeout(() => {
      setIsInitialToolbarVisible(false);
      activeTimer = null;
    }, autoHideDelay);
  });

  return {
    isInitialToolbarVisible,
    setIsInitialToolbarVisible,
  };
}
