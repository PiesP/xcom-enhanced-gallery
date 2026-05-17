/**
 * @fileoverview Toolbar Types - Shared UI State Types
 */

/** Toolbar data state (business logic) */
export type ToolbarDataState = 'idle' | 'loading' | 'downloading' | 'error';

/** Toolbar UI state object */
export interface ToolbarState {
  /** Download in progress state */
  readonly isDownloading: boolean;
  /** Loading state */
  readonly isLoading: boolean;
  /** Error occurred state */
  readonly hasError: boolean;
}

/**
 * Toolbar actions interface.
 *
 * @description Actions that modify ToolbarState
 */
export interface ToolbarActions {
  /** Set download state */
  setDownloading(value: boolean): void;
  /** Set loading state */
  setLoading(value: boolean): void;
  /** Set error state */
  setError(value: boolean): void;
  /** Reset state */
  resetState(): void;
}
