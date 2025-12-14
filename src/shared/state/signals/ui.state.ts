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
export interface GalleryUiState {
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

// ============================================================================
// State Accessors
// ============================================================================

/**
 * Get current UI state
 */
export function getUiState(): GalleryUiState {
  return {
    viewMode: uiSignals.viewMode.value,
    isLoading: uiSignals.isLoading.value,
    error: uiSignals.error.value,
  };
}

/**
 * Get current view mode
 */
export function getViewMode(): ViewMode {
  return uiSignals.viewMode.value;
}

/**
 * Check if loading
 */
export function isLoading(): boolean {
  return uiSignals.isLoading.value;
}

/**
 * Get current error
 */
export function getError(): string | null {
  return uiSignals.error.value;
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Set view mode
 */
export function setViewMode(viewMode: ViewMode): void {
  uiSignals.viewMode.value = viewMode;
  logger.debug(`[Gallery UI] View mode changed to: ${viewMode}`);
}

/**
 * Set loading state
 */
export function setLoading(isLoading: boolean): void {
  uiSignals.isLoading.value = isLoading;
}

/**
 * Set error state
 */
export function setError(error: string | null): void {
  uiSignals.error.value = error;
  if (error) {
    uiSignals.isLoading.value = false;
    logger.error(`[Gallery UI] Error: ${error}`);
  }
}

/**
 * Reset UI state to initial values
 */
export function resetUiState(): void {
  uiSignals.viewMode.value = INITIAL_UI_STATE.viewMode;
  uiSignals.isLoading.value = INITIAL_UI_STATE.isLoading;
  uiSignals.error.value = INITIAL_UI_STATE.error;
}

/**
 * Clear error
 */
export function clearError(): void {
  uiSignals.error.value = null;
}
