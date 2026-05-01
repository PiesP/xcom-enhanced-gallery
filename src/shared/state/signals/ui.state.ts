/**
 * @fileoverview Gallery UI State Management
 *
 * UI state extracted from gallery.signals.ts for modularity.
 * Manages view mode, loading, and error states.
 *
 * Key features:
 * - Fine-grained signals for UI state
 * - Isolated from navigation logic
 * - Simpler dependency graph
 */

import { logger } from '@shared/logging/logger';
import { createSignalSafe } from '@shared/state/signals/signal-factory';

// ============================================================================
// Types
// ============================================================================

/**
 * View mode types for gallery display
 *
 * @property vertical - Vertical stacked layout
 */
export type ViewMode = 'vertical';

/**
 * Gallery UI state interface
 *
 * @property viewMode - Current view mode (horizontal or vertical)
 * @property isLoading - True when gallery is loading media
 * @property error - Error message if gallery encounters an issue, null otherwise
 */
interface GalleryUiState {
  readonly viewMode: ViewMode;
  readonly isLoading: boolean;
  readonly error: string | null;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Initial UI state values
 *
 * Default configuration for gallery UI state.
 */
const INITIAL_UI_STATE: GalleryUiState = {
  viewMode: 'vertical',
  isLoading: false,
  error: null,
};

// ============================================================================
// Fine-grained Signals
// ============================================================================

/**
 * Fine-grained UI signals for gallery state management
 *
 * Provides reactive signals for view mode, loading state, and error handling.
 * Each signal can be accessed and updated independently for optimal reactivity.
 *
 * @property viewMode - Signal for current gallery view mode
 * @property isLoading - Signal for loading state indicator
 * @property error - Signal for error message (null when no error)
 */
const [_viewMode, setViewMode] = createSignalSafe<ViewMode>(INITIAL_UI_STATE.viewMode);
const [_isLoading, setIsLoading] = createSignalSafe<boolean>(INITIAL_UI_STATE.isLoading);
const [_error, setErrorSignal] = createSignalSafe<string | null>(INITIAL_UI_STATE.error);

function subscribeRead(read: () => unknown, cb: (v: unknown) => void): () => void {
  return effectSafe(() => cb(read()));
}

export const uiSignals = {
  viewMode: Object.assign(() => _viewMode(), { set: setViewMode, subscribe: (cb: (v: ViewMode) => void) => subscribeRead(_viewMode, cb as (v: unknown) => void) }) as { (): ViewMode; set(v: ViewMode): void; subscribe(cb: (v: ViewMode) => void): () => void; },
  isLoading: Object.assign(() => _isLoading(), { set: setIsLoading, subscribe: (cb: (v: boolean) => void) => subscribeRead(_isLoading, cb as (v: unknown) => void) }) as { (): boolean; set(v: boolean): void; subscribe(cb: (v: boolean) => void): () => void; },
  error: Object.assign(() => _error(), { set: setErrorSignal, subscribe: (cb: (v: string | null) => void) => subscribeRead(_error, cb as (v: unknown) => void) }) as { (): string | null; set(v: string | null): void; subscribe(cb: (v: string | null) => void): () => void; },
};

/**
 * Set gallery error state
 *
 * Updates the error signal and automatically stops loading when an error occurs.
 * In development mode, logs the error for debugging purposes.
 *
 * @param error - Error message to display, or null to clear error
 *
 * @example
 * ```typescript
 * setError('Failed to load media');
 * // or clear error
 * setError(null);
 * ```
 */
export function setError(error: string | null): void {
  uiSignals.error = error;
  if (error) {
    uiSignals.isLoading = false;
    if (__DEV__) {
      logger.error(`[Gallery UI] Error: ${error}`);
    }
  }
}
