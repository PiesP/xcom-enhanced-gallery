/**
 * @fileoverview Toolbar Types - Shared UI State Types
 */

/** Toolbar data state (business logic) */
export type ToolbarDataState = 'idle' | 'loading' | 'downloading' | 'error';

/** Image fit mode */
export type FitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';

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
 *
 * @example
 * ```typescript
 * const actions: ToolbarActions = {
 *   setDownloading: (value) => setState('isDownloading', value),
 *   setLoading: (value) => setState('isLoading', value),
 *   // ...
 * };
 * ```
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

/**
 * Toolbar ViewModel (derived state).
 *
 * @description Normalized toolbar information ready for UI consumption.
 * Provides memo-friendly aggregate data that can be shared across
 * components without duplicating state calculations.
 */
export interface ToolbarViewModel {
  readonly totalCount: number;
  readonly currentIndex: number;
  readonly focusedIndex: number;
  readonly displayedIndex: number;
  readonly hasItems: boolean;
  readonly hasMultipleItems: boolean;
  readonly hasTweetText: boolean;
  readonly progressPercent: number;
  readonly progressWidth: string;
  readonly tweetText?: string | null;
  readonly tweetTextHTML?: string | null;
}
