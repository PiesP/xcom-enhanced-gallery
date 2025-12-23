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
interface NavigationHandlers {
  /** Navigate to the previous media item */
  readonly onPrevious: () => void;
  /** Navigate to the next media item */
  readonly onNext: () => void;
}

/**
 * Download handlers for media download operations
 */
interface DownloadHandlers {
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
interface LifecycleHandlers {
  /** Close the gallery */
  readonly onClose: () => void;
  /** Called when settings panel is opened */
  readonly onOpenSettings?: (() => void) | undefined;
}

/**
 * Focus event handlers for keyboard navigation support
 */
interface FocusHandlers {
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
