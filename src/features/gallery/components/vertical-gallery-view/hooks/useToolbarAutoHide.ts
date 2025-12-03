/**
 * @fileoverview Toolbar auto-hide hook
 * @description Manages toolbar visibility with auto-hide timer functionality
 * @module features/gallery/components/vertical-gallery-view/hooks/useToolbarAutoHide
 * @version 1.0.0
 */

import { getSetting } from '@shared/container/settings-access';
import { createEffect, createSignal, onCleanup } from '@shared/external/vendors/solid-hooks';
import { globalTimerManager } from '@shared/utils/time/timer-management';

/**
 * Options for toolbar auto-hide hook
 */
export interface UseToolbarAutoHideOptions {
  /** Whether the gallery is visible */
  readonly isVisible: () => boolean;
  /** Whether there are media items */
  readonly hasItems: () => boolean;
}

/**
 * Result of toolbar auto-hide hook
 */
export interface UseToolbarAutoHideResult {
  /** Whether toolbar should be initially visible */
  readonly isInitialToolbarVisible: () => boolean;
  /** Setter for initial toolbar visibility */
  readonly setIsInitialToolbarVisible: (value: boolean) => void;
}

/**
 * Hook to manage toolbar auto-hide behavior
 *
 * Features:
 * - Shows toolbar initially when gallery opens
 * - Auto-hides after configurable delay
 * - Respects user settings for delay duration
 * - Properly cleans up timers
 *
 * @param options - Hook configuration
 * @returns Toolbar visibility state and setter
 */
export function useToolbarAutoHide(options: UseToolbarAutoHideOptions): UseToolbarAutoHideResult {
  const { isVisible, hasItems } = options;

  const computeInitialVisibility = (): boolean => Boolean(isVisible() && hasItems());
  const [isInitialToolbarVisible, setIsInitialToolbarVisible] = createSignal(
    computeInitialVisibility()
  );
  let activeTimer: number | null = null;

  const clearActiveTimer = () => {
    if (activeTimer === null) {
      return;
    }

    globalTimerManager.clearTimeout(activeTimer);
    activeTimer = null;
  };

  createEffect(() => {
    onCleanup(clearActiveTimer);

    if (!computeInitialVisibility()) {
      setIsInitialToolbarVisible(false);
      return;
    }

    // Show toolbar initially when gallery opens
    setIsInitialToolbarVisible(true);

    // Get auto-hide delay from settings (default 3s)
    const autoHideDelay = getSetting<number>('toolbar.autoHideDelay', 3000);

    // If delay is 0, hide immediately
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
