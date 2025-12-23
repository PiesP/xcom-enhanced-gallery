/**
 * @fileoverview Gallery UI State Management
 * @version 1.0.0 - Phase: State Management Simplification
 *
 * UI state extracted from gallery.signals.ts for modularity.
 * Manages view mode, loading, and error states.
 *
 * Key features:
 * - Fine-grained signals for UI state
 * - Isolated from navigation logic
 * - Simpler dependency graph
 */

import { logger } from '@shared/logging';
import { createSignalSafe } from '@shared/state/signals/signal-factory';

// ============================================================================
// Types
// ============================================================================

/**
 * View mode types
 */
export type ViewMode = 'horizontal' | 'vertical';

/**
 * Gallery UI state interface
 */
interface GalleryUiState {
  readonly viewMode: ViewMode;
  readonly isLoading: boolean;
  readonly error: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const INITIAL_UI_STATE: GalleryUiState = {
  viewMode: 'vertical',
  isLoading: false,
  error: null,
};

// ============================================================================
// Fine-grained Signals
// ============================================================================

export const uiSignals = {
  viewMode: createSignalSafe<ViewMode>(INITIAL_UI_STATE.viewMode),
  isLoading: createSignalSafe<boolean>(INITIAL_UI_STATE.isLoading),
  error: createSignalSafe<string | null>(INITIAL_UI_STATE.error),
};

/**
 * Set error state
 */
export function setError(error: string | null): void {
  uiSignals.error.value = error;
  if (error) {
    uiSignals.isLoading.value = false;
    if (__DEV__) {
      logger.error(`[Gallery UI] Error: ${error}`);
    }
  }
}
