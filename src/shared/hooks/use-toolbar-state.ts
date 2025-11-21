/**
 * @fileoverview Toolbar State Management Hook - Phase 2B Step 2
 * @description Custom Solid.js hook for toolbar UI state management
 *
 * **Responsibilities**:
 * - Download state management with 300ms minimum display
 * - Loading state management
 * - Error state management
 * - State reset and cleanup
 *
 * **Features**:
 * - Download debounce: Minimum 300ms display even for quick operations
 * - State sync: Error clears loading/downloading; loading clears error
 * - Proper cleanup: Timeout cleared on component unmount
 * - Solid.js store-based: Reactive updates without manual invalidation
 *
 * **Integration**:
 * - Uses globalTimerManager for timer management
 * - Uses Solid.js createStore for reactive state
 * **Performance**:
 * - Download timeout only scheduled when needed
 * - Store updates batched within Solid.js reactivity system
 * - Cleanup prevents timer leaks
 *
 * - {@link ../utils/toolbar-utils.ts} - State extraction and styling utilities
 * - {@link ../types/toolbar.types.ts} - State type definitions
 * - {@link ../../features/gallery/hooks/use-gallery-app.ts} - Main app integration
 *
 * @version 11.0.0 - Phase 376: Comprehensive documentation
 * @internal Solid.js hook, PC-only, used by toolbar container
 */

import { getSolid, getSolidStore } from '@shared/external/vendors';
import { globalTimerManager } from '@shared/utils/timer-management';
import type { ToolbarState, ToolbarActions } from '@shared/types/toolbar.types';

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
  const { onCleanup } = getSolid();
  const { createStore } = getSolidStore();

  const [state, setState] = createStore<ToolbarState>({ ...INITIAL_STATE });

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
   * Set downloading state with 300ms minimum display debounce
   *
   * **Behavior**:
   * - On true: Mark start time, clear any pending timeout, set state immediately
   * - On false:
   *   - If > 300ms elapsed: Clear state immediately
   *   - If < 300ms elapsed: Schedule state clear after remaining time
   *
   * @param downloading - New downloading state
   * @internal State action
   */
  const setDownloading = (downloading: boolean): void => {
    const now = Date.now();

    if (downloading) {
      lastDownloadToggle = now;
      clearDownloadTimeout();
      setState({
        isDownloading: true,
        hasError: false,
      });
      return;
    }

    const timeSinceStart = now - lastDownloadToggle;
    const minDisplayTime = 300;

    if (timeSinceStart < minDisplayTime) {
      clearDownloadTimeout();
      downloadTimeoutRef = globalTimerManager.setTimeout(() => {
        setState({ isDownloading: false });
        downloadTimeoutRef = null;
      }, minDisplayTime - timeSinceStart);
      return;
    }

    setState({ isDownloading: false });
  };

  const setLoading = (loading: boolean): void => {
    setState({
      isLoading: loading,
      // Clear error when loading starts
      hasError: loading ? false : state.hasError,
    });
  };

  /**
   * Set error state
   *
   * **Behavior**:
   * - When error set to true: Clear loading and downloading states
   * - Prevents invalid state (error + loading/downloading simultaneously)
   *
   * @param hasError - New error state
   * @internal State action
   */
  const setError = (hasError: boolean): void => {
    setState({
      hasError,
      // Clear loading/downloading when error occurs
      isLoading: hasError ? false : state.isLoading,
      isDownloading: hasError ? false : state.isDownloading,
    });
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
    setState(() => ({ ...INITIAL_STATE }));
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

  return [state, actions];
}
