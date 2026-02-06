/**
 * @fileoverview Toolbar state management hook with download debouncing
 * @description Manages toolbar UI state (download, loading, error) with proper debouncing
 */

import type { ToolbarActions, ToolbarState } from '@shared/types/toolbar.types';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import { createSignal, onCleanup } from 'solid-js';

/**
 * Minimum display time (ms) for download state to prevent UI flickering
 * @internal
 */
const DOWNLOAD_MIN_DISPLAY_TIME = 300;

/**
 * Initial toolbar state (isDownloading, isLoading, hasError all false)
 * @internal
 */
const INITIAL_STATE: ToolbarState = {
  isDownloading: false,
  isLoading: false,
  hasError: false,
} as const;

/**
 * Toolbar state management hook with download debouncing and state synchronization
 * @returns Tuple: [state object (reactive), actions object (methods)]
 */
export function useToolbarState(): [ToolbarState, ToolbarActions] {
  const [isDownloading, setIsDownloading] = createSignal(INITIAL_STATE.isDownloading);
  const [isLoading, setIsLoading] = createSignal(INITIAL_STATE.isLoading);
  const [hasError, setHasError] = createSignal(INITIAL_STATE.hasError);

  let lastDownloadToggle = 0;
  let downloadTimeoutRef: number | null = null;

  const clearDownloadTimeout = (): void => {
    if (downloadTimeoutRef !== null) {
      globalTimerManager.clearTimeout(downloadTimeoutRef);
      downloadTimeoutRef = null;
    }
  };

  /**
   * Set downloading state with minimum display debounce
   * @param downloading - New downloading state
   */
  const setDownloading = (downloading: boolean): void => {
    const now = Date.now();

    if (downloading) {
      lastDownloadToggle = now;
      clearDownloadTimeout();
      setIsDownloading(true);
      setHasError(false);
      return;
    }

    const timeSinceStart = now - lastDownloadToggle;

    if (timeSinceStart < DOWNLOAD_MIN_DISPLAY_TIME) {
      clearDownloadTimeout();
      downloadTimeoutRef = globalTimerManager.setTimeout(() => {
        setIsDownloading(false);
        downloadTimeoutRef = null;
      }, DOWNLOAD_MIN_DISPLAY_TIME - timeSinceStart);
      return;
    }

    setIsDownloading(false);
  };

  /**
   * Set loading state (clears error when loading starts)
   * @param loading - New loading state
   */
  const setLoading = (loading: boolean): void => {
    setIsLoading(loading);
    if (loading) {
      setHasError(false);
    }
  };

  /**
   * Set error state (clears loading and downloading when error occurs)
   * @param errorState - New error state
   */
  const setError = (errorState: boolean): void => {
    setHasError(errorState);
    if (errorState) {
      setIsLoading(false);
      setIsDownloading(false);
    }
  };

  /**
   * Reset all state to initial values and clear timers
   */
  const resetState = (): void => {
    clearDownloadTimeout();
    lastDownloadToggle = 0;
    setIsDownloading(INITIAL_STATE.isDownloading);
    setIsLoading(INITIAL_STATE.isLoading);
    setHasError(INITIAL_STATE.hasError);
  };

  onCleanup(() => {
    clearDownloadTimeout();
  });

  const actions: ToolbarActions = {
    setDownloading,
    setLoading,
    setError,
    resetState,
  };

  // Create reactive state object with getter properties
  const state: ToolbarState = {
    get isDownloading() {
      return isDownloading();
    },
    get isLoading() {
      return isLoading();
    },
    get hasError() {
      return hasError();
    },
  };

  return [state, actions];
}
