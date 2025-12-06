/**
 * @fileoverview Grouped handler types for Toolbar component
 *
 * This module defines organized handler interfaces that group related
 * callback functions together for better maintainability and type safety.
 *
 * @example
 * ```typescript
 * const handlers: ToolbarHandlers = {
 *   navigation: { onPrevious: () => {}, onNext: () => {} },
 *   download: { onDownloadCurrent: () => {}, onDownloadAll: () => {} },
 *   fitMode: { onFitOriginal: () => {}, ... },
 *   lifecycle: { onClose: () => {} },
 * };
 * ```
 */

/**
 * Navigation handlers for gallery traversal
 */
export interface NavigationHandlers {
  /** Navigate to the previous media item */
  readonly onPrevious: () => void;
  /** Navigate to the next media item */
  readonly onNext: () => void;
}

/**
 * Download handlers for media download operations
 */
export interface DownloadHandlers {
  /** Download the currently displayed media item */
  readonly onDownloadCurrent: () => void;
  /** Download all media items in the gallery */
  readonly onDownloadAll: () => void;
}

/**
 * Fit mode handlers for controlling image display sizing
 */
export interface FitModeHandlers {
  /** Display image at original size */
  readonly onFitOriginal?: ((event?: Event) => void) | undefined;
  /** Fit image to container width */
  readonly onFitWidth?: ((event?: Event) => void) | undefined;
  /** Fit image to container height */
  readonly onFitHeight?: ((event?: Event) => void) | undefined;
  /** Fit image within container bounds */
  readonly onFitContainer?: ((event?: Event) => void) | undefined;
}

/**
 * Lifecycle handlers for gallery state management
 */
export interface LifecycleHandlers {
  /** Close the gallery */
  readonly onClose: () => void;
  /** Called when settings panel is opened */
  readonly onOpenSettings?: (() => void) | undefined;
}

/**
 * Focus event handlers for keyboard navigation support
 */
export interface FocusHandlers {
  /** Handle focus event */
  readonly onFocus?: ((event: FocusEvent) => void) | undefined;
  /** Handle blur event */
  readonly onBlur?: ((event: FocusEvent) => void) | undefined;
  /** Handle keydown event */
  readonly onKeyDown?: ((event: KeyboardEvent) => void) | undefined;
}

/**
 * Combined toolbar handlers interface
 *
 * Groups all handler types into a single organized structure.
 * Each handler group is optional to allow incremental adoption.
 */
export interface ToolbarHandlers {
  /** Navigation controls (previous/next) */
  readonly navigation: NavigationHandlers;
  /** Download controls */
  readonly download: DownloadHandlers;
  /** Fit mode controls (optional) */
  readonly fitMode?: FitModeHandlers | undefined;
  /** Lifecycle controls (close, settings) */
  readonly lifecycle: LifecycleHandlers;
  /** Focus event handlers (optional) */
  readonly focus?: FocusHandlers | undefined;
}

/**
 * Helper type to extract individual handler from grouped handlers
 */
export type ExtractHandler<T, K extends keyof T> = T[K];

/**
 * Creates default empty handlers for optional handler groups
 */
export function createEmptyFitModeHandlers(): FitModeHandlers {
  return {
    onFitOriginal: undefined,
    onFitWidth: undefined,
    onFitHeight: undefined,
    onFitContainer: undefined,
  };
}

/**
 * Creates default empty handlers for focus events
 */
export function createEmptyFocusHandlers(): FocusHandlers {
  return {
    onFocus: undefined,
    onBlur: undefined,
    onKeyDown: undefined,
  };
}

/**
 * Type guard to check if fit mode handlers are provided
 */
export function hasFitModeHandlers(
  handlers: ToolbarHandlers,
): handlers is ToolbarHandlers & { fitMode: FitModeHandlers } {
  return handlers.fitMode !== undefined;
}

/**
 * Type guard to check if focus handlers are provided
 */
export function hasFocusHandlers(
  handlers: ToolbarHandlers,
): handlers is ToolbarHandlers & { focus: FocusHandlers } {
  return handlers.focus !== undefined;
}
