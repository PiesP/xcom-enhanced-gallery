/**
 * @fileoverview Toolbar State Management Hook
 * @description Custom Solid.js hook for toolbar UI state management with debounced download state
 *
 * **Responsibilities**:
 * - Download state management with 300ms minimum display
 * - Loading state management (with error clearing)
 * - Error state management (with loading/downloading clearing)
 * - State reset and cleanup with timer management
 *
 * **Features**:
 * - Download debounce: Minimum 300ms display even for quick operations (prevents UI flickering)
 * - State sync: Error clears loading/downloading; loading clears error (prevents invalid states)
 * - Proper cleanup: Timeout cleared on component unmount (prevents memory leaks)
 * - Solid.js signal-based: Fine-grained reactivity with tree-shaking benefits
 *
 * **Integration**:
 * - Uses globalTimerManager for timer management
 * - Uses Solid.js createSignal for reactive state (tree-shaking friendly vs createStore)
 *
 * **Performance**:
 * - Download timeout only scheduled when needed
 * - Signal updates batched within Solid.js reactivity system
 * - Cleanup prevents timer leaks
 * - No solid-js/store dependency for smaller bundle size
 *
 * **Related Resources**:
 * - {@link ../utils/toolbar-utils.ts} - State extraction and styling utilities
 * - {@link ../types/toolbar.types.ts} - State type definitions
 * - {@link ../../features/gallery/hooks/use-gallery-app.ts} - Main app integration
 *
 * @version 12.0.0 - Migrated from createStore to createSignal for bundle optimization
 * @internal Solid.js hook, PC-only, used by toolbar container
 */

import type { ToolbarActions, ToolbarState } from '@shared/types/toolbar.types';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import { createSignal, onCleanup } from 'solid-js';

/**
 * Minimum display time (ms) for download state to prevent UI flickering
 *
 * @internal Download state debounce time constant
 */
const DOWNLOAD_MIN_DISPLAY_TIME = 300;

/**
 * Initial toolbar state constant
 *
 * **State Schema**:
 * - `isDownloading`: Download operation in progress
 * - `isLoading`: Async data loading in progress
 * - `hasError`: Error occurred during operation
 *
 * @internal Default values for new toolbar instances
 */
const INITIAL_STATE: ToolbarState = {
  isDownloading: false,
  isLoading: false,
  hasError: false,
} as const;

/**
 * Toolbar State Management Hook
 *
 * **Purpose**: Manages toolbar UI state (download, loading, error) with proper debouncing
 *
 * **State Properties**:
 * - `isDownloading`: Download in progress (minimum 300ms display)
 * - `isLoading`: Async operation in progress
 * - `hasError`: Error occurred
 *
 * **Actions Provided**:
 * - `setDownloading(bool)`: Toggle download state with debounce
 * - `setLoading(bool)`: Toggle loading state, clears error on start
 * - `setError(bool)`: Set error state, clears loading/downloading on error
 * - `resetState()`: Reset all state to initial values and cleanup timers
 *
 * **Download Debounce**:
 * - Minimum 300ms display to avoid UI flickering
 * - Tracks start time, schedules completion if fast
 * - Useful for brief operations (quick user feedback)
 *
 * **State Sync**:
 * - Loading start → clears error
 * - Error set → clears loading and downloading
 * - Prevents invalid state combinations
 *
 * **Cleanup**:
 * - Timeouts cleared on reset
 * - onCleanup ensures cleanup on component unmount
 * - No memory leaks from lingering timers
 *
 * **Example**:
 * ```typescript
 * const [toolbarState, toolbarActions] = useToolbarState();
 *
 * // React to state
 * return (
 *   <div classList={{ loading: toolbarState.isLoading }}>
 *     <button onClick={() => toolbarActions.setDownloading(true)}>
 *       {toolbarState.isDownloading ? 'Downloading...' : 'Download'}
 *     </button>
 *   </div>
 * );
 * ```
 *
 * @returns Tuple: [state object (reactive), actions object (methods)]
 * @internal Solid.js hook, used by toolbar container
 */
export function useToolbarState(): [ToolbarState, ToolbarActions] {
  // Individual signals for each state property (fine-grained reactivity)
  const [isDownloading, setIsDownloading] = createSignal(INITIAL_STATE.isDownloading);
  const [isLoading, setIsLoading] = createSignal(INITIAL_STATE.isLoading);
  const [hasError, setHasError] = createSignal(INITIAL_STATE.hasError);

  let lastDownloadToggle = 0;
  let downloadTimeoutRef: number | null = null;

  /**
   * Clear pending download timeout
   * @internal Helper
   */
  const clearDownloadTimeout = (): void => {
    if (downloadTimeoutRef !== null) {
      globalTimerManager.clearTimeout(downloadTimeoutRef);
      downloadTimeoutRef = null;
    }
  };

  /**
   * Set downloading state with minimum display debounce
   *
   * **Behavior**:
   * - On true: Mark start time, clear any pending timeout, set state immediately, clear error
   * - On false:
   *   - If elapsed time >= DOWNLOAD_MIN_DISPLAY_TIME: Clear state immediately
   *   - If elapsed time < DOWNLOAD_MIN_DISPLAY_TIME: Schedule state clear after remaining time
   *
   * **Purpose**: Prevents UI flickering on fast operations while providing user feedback
   *
   * @param downloading - New downloading state
   * @internal State action
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
   * Set loading state
   *
   * **Behavior**:
   * - When loading starts: Clear error state to prevent conflicting signals
   * - Prevents invalid state where both loading and error are true
   *
   * @param loading - New loading state
   * @internal State action
   */
  const setLoading = (loading: boolean): void => {
    setIsLoading(loading);
    // Clear error when loading starts
    if (loading) {
      setHasError(false);
    }
  };

  /**
   * Set error state
   *
   * **Behavior**:
   * - When error set to true: Clear loading and downloading states
   * - Prevents invalid state (error + loading/downloading simultaneously)
   *
   * @param errorState - New error state
   * @internal State action
   */
  const setError = (errorState: boolean): void => {
    setHasError(errorState);
    // Clear loading/downloading when error occurs
    if (errorState) {
      setIsLoading(false);
      setIsDownloading(false);
    }
  };

  /**
   * Reset all state to initial values and clear timers
   *
   * **Cleanup**:
   * - Clears pending download timeout
   * - Resets download toggle timestamp
   * - Restores all state properties to defaults
   *
   * @internal State action, called during cleanup
   */
  const resetState = (): void => {
    clearDownloadTimeout();
    lastDownloadToggle = 0;
    setIsDownloading(INITIAL_STATE.isDownloading);
    setIsLoading(INITIAL_STATE.isLoading);
    setHasError(INITIAL_STATE.hasError);
  };

  /**
   * Component unmount cleanup
   * Ensures timers are cleared to prevent memory leaks
   * @internal Solid.js lifecycle
   */
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
  // This maintains API compatibility with the previous createStore implementation
  // while using signals for tree-shaking benefits
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
