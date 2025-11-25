/**
 * @fileoverview Toolbar auto-hide hook
 * @description Manages toolbar visibility with auto-hide timer functionality
 * @module features/gallery/components/vertical-gallery-view/hooks/useToolbarAutoHide
 * @version 1.0.0
 */

import { getSetting } from '@shared/container/settings-access';
import { getSolid } from '@shared/external/vendors';
import { globalTimerManager } from '@shared/utils/time/timer-management';

const { createSignal, createEffect, onCleanup } = getSolid();

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

  const [isInitialToolbarVisible, setIsInitialToolbarVisible] = createSignal(true);

  createEffect(() => {
    if (!isVisible() || !hasItems()) {
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
    const timer = globalTimerManager.setTimeout(() => {
      setIsInitialToolbarVisible(false);
    }, autoHideDelay);

    onCleanup(() => {
      globalTimerManager.clearTimeout(timer);
    });
  });

  return {
    isInitialToolbarVisible,
    setIsInitialToolbarVisible,
  };
}
