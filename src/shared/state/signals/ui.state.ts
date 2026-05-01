/**
 * @fileoverview Gallery UI State Management
 *
 * UI state extracted from gallery.signals.ts for modularity.
 * Manages view mode, loading, and error states.
 */

import { logger } from '@shared/logging/logger';
import { createSignalSafe } from '@shared/state/signals/signal-factory';

export type ViewMode = 'vertical';

interface GalleryUiState {
  readonly viewMode: ViewMode;
  readonly isLoading: boolean;
  readonly error: string | null;
}

const INITIAL_UI_STATE: GalleryUiState = {
  viewMode: 'vertical',
  isLoading: false,
  error: null,
};

const [_viewMode, setViewMode] = createSignalSafe<ViewMode>(INITIAL_UI_STATE.viewMode);
const [_isLoading, setIsLoading] = createSignalSafe<boolean>(INITIAL_UI_STATE.isLoading);
const [_error, setErrorSignal] = createSignalSafe<string | null>(INITIAL_UI_STATE.error);

export const uiSignals = {
  get viewMode() {
    return _viewMode();
  },
  set viewMode(v: ViewMode) {
    setViewMode(v);
  },
  get isLoading() {
    return _isLoading();
  },
  set isLoading(v: boolean) {
    setIsLoading(v);
  },
  get error() {
    return _error();
  },
  set error(v: string | null) {
    setErrorSignal(v);
  },
};

export function setError(error: string | null): void {
  uiSignals.error = error;
  if (error) {
    uiSignals.isLoading = false;
    if (__DEV__) {
      logger.error(`[Gallery UI] Error: ${error}`);
    }
  }
}
