/**
 * @fileoverview Toolbar Types - Shared UI State Types
 * @version 3.0.0 - Phase 219: Type System Consolidation
 * @description Toolbar related UI state type definitions
 *
 * **Important: Type System Clarification (Phase 219)**:
 * ToolbarState in this file is a "UI state" type.
 *
 * Do not confuse with separate "mode state":
 * - This file (toolbar.types.ts): ToolbarState = UI state
 *   Structure: { isDownloading, isLoading, hasError, currentFitMode, needsHighContrast }
 *   Purpose: Component visual state management
 *
 * - @shared/state/signals/toolbar.signals.ts: ToolbarModeStateData = Mode state
 *   Structure: { currentMode: 'gallery'|'settings'|'download', needsHighContrast }
 *   Purpose: Global mode management (which panel to show)
 *
 * **History**:
 * - Phase 196: src/shared/types/toolbar-types.ts created
 * - Phase 197.1: Moved to @shared/types (resolved circular dependency)
 * - Phase 219: Separated ToolbarModeState (resolved naming conflict)
 *
 * **Migration Path**:
 * - Re-exported from @features/gallery/types (backward compatibility)
 */

/**
 * Toolbar data state (business logic)
 *
 * @description State type that tracks toolbar state in business logic
 *
 * - 'idle': Idle state (no operations)
 * - 'loading': Data loading
 * - 'downloading': Download in progress
 * - 'error': Error occurred
 */
export type ToolbarDataState = 'idle' | 'loading' | 'downloading' | 'error';

/**
 * Image fit mode (Fit Mode)
 *
 * @description Defines how images are rendered within container
 *
 * - 'original': Keep original size
 * - 'fitWidth': Fit to width
 * - 'fitHeight': Fit to height
 * - 'fitContainer': Fill container
 *
 * @note Toolbar component and UI rendering only
 * @note Maintain consistency with ImageFitMode in ui.types.ts
 * @see ui.types.ts ImageFitMode
 */
export type FitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';

/**
 * Toolbar UI state object
 *
 * @description UI/visual state managed by Toolbar component
 *
 * **⚠️ Important**: This is "UI state".
 * Different from global "mode state".
 * @see @shared/state/signals/toolbar.signals.ts ToolbarModeStateData
 *
 * @example
 * ```typescript
 * const [state, setState] = createSignal<ToolbarState>({
 *   isDownloading: false,
 *   isLoading: false,
 *   hasError: false,
 *   currentFitMode: 'fitContainer',
 *   needsHighContrast: false,
 * });
 * ```
 */
export interface ToolbarState {
  /** Download in progress state */
  readonly isDownloading: boolean;
  /** Loading state */
  readonly isLoading: boolean;
  /** Error occurred state */
  readonly hasError: boolean;
  /** Current fit mode */
  readonly currentFitMode: FitMode;
  /** High contrast mode needed (WCAG accessibility) */
  readonly needsHighContrast: boolean;
}

/**
 * Toolbar actions interface
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
  /** Set high contrast mode */
  setHighContrast(value: boolean): void;
  /** Reset state */
  resetState(): void;
}
