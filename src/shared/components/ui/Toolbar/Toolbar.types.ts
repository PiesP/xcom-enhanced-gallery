/**
 * @file Toolbar Type Definitions
 * @description Type system for the Gallery Toolbar component, defining props, callbacks,
 * and related types for media navigation, fit modes, and expandable panels (settings/tweet).
 *
 * @architecture
 * - **Presentation & State Separation**: ToolbarProps interface defines all prop contracts
 * - **Fit Modes**: Enum-like values ('original', 'fitWidth', 'fitHeight', 'fitContainer')
 * - **Event Handlers**: Callback functions for user interactions (navigation, downloads, UI toggles)
 * - **Accessibility**: Built-in ARIA attributes and semantic HTML role support
 * - **Panel Management**: Props for expandable settings and tweet text panels
 *
 * @example
 * ```typescript
 * // Minimal toolbar (required props only)
 * const toolbarProps: ToolbarProps = {
 *   currentIndex: 0,
 *   totalCount: 5,
 *   onPrevious: () => console.log('Previous'),
 *   onNext: () => console.log('Next'),
 *   onDownloadCurrent: () => console.log('Download current'),
 *   onDownloadAll: () => console.log('Download all'),
 *   onClose: () => console.log('Close gallery'),
 * };
 *
 * // Full toolbar with fit modes, settings, and tweet panel
 * const fullToolbarProps: ToolbarProps = {
 *   currentIndex: 0,
 *   focusedIndex: 0,
 *   totalCount: 5,
 *   currentViewMode: 'fit',
 *   onViewModeChange: (mode) => console.log('View mode:', mode),
 *   onPrevious: () => {},
 *   onNext: () => {},
 *   onDownloadCurrent: () => {},
 *   onDownloadAll: () => {},
 *   onClose: () => {},
 *   onOpenSettings: () => {},
 *   onFitOriginal: (event) => console.log('Original size'),
 *   onFitWidth: (event) => console.log('Fit width'),
 *   onFitHeight: (event) => console.log('Fit height'),
 *   onFitContainer: (event) => console.log('Fit container'),
 *   disabled: false,
 *   isDownloading: false,
 *   className: 'custom-toolbar',
 *   'data-testid': 'gallery-toolbar',
 *   'aria-label': 'Gallery controls',
 *   tweetText: 'Check out this photo!',
 * };
 * ```
 */

import type { ViewMode, FitMode } from '@shared/types';

/**
 * Re-export FitMode for component convenience
 * Represents the media fitting mode in the gallery viewer
 * @type {'original' | 'fitWidth' | 'fitHeight' | 'fitContainer'}
 */
export type { FitMode };

/**
 * @interface ToolbarProps
 * @description Comprehensive prop interface for the Toolbar component
 * Handles media navigation, downloading, settings, and tweet text display
 *
 * @section Navigation Props
 * Properties for controlling media navigation and current position tracking
 *
 * @section Download Props
 * Properties for controlling file downloads (single/bulk with ZIP)
 *
 * @section Fit Mode Props
 * Properties for handling different media fitting modes and responsive behavior
 *
 * @section UI State Props
 * Properties for controlling toolbar visibility, disabled state, and loading indicators
 *
 * @section Accessibility Props
 * ARIA attributes and semantic HTML support for screen readers and keyboard navigation
 *
 * @section Panel Props
 * Properties for expandable panels (settings, tweet text)
 *
 * @accessibility
 * - Implements WCAG 2.1 AA standard with full keyboard navigation
 * - Supports prefers-reduced-motion and prefers-color-scheme
 * - All buttons have aria-label for screen reader context
 * - Uses aria-live regions for dynamic status updates
 * - Supports focus management and outline visibility
 */
export interface ToolbarProps {
  /**
   * @section Navigation Props
   */

  /**
   * Current index of displayed media (0-based)
   * Used to show progress and enable/disable navigation buttons
   * @type {number}
   * @default 0
   */
  currentIndex: number;

  /**
   * Index of focused media (e.g., hovered thumbnail)
   * Takes precedence over currentIndex for display purposes
   * @type {number | null | undefined}
   * @default undefined
   */
  focusedIndex?: number | null;

  /**
   * Total count of media items
   * Used to calculate progress and determine if navigation is possible
   * @type {number}
   * @default 0
   */
  totalCount: number;

  /**
   * Callback fired when user clicks previous navigation button
   * Receives MouseEvent from button click
   * @type {() => void}
   * @required
   */
  onPrevious: () => void;

  /**
   * Callback fired when user clicks next navigation button
   * Receives MouseEvent from button click
   * @type {() => void}
   * @required
   */
  onNext: () => void;

  /**
   * @section Download Props
   */

  /**
   * Callback fired when user clicks download current media button
   * Receives MouseEvent from button click
   * @type {() => void}
   * @required
   */
  onDownloadCurrent: () => void;

  /**
   * Callback fired when user clicks download all media as ZIP button
   * Receives MouseEvent from button click
   * @type {() => void}
   * @required
   */
  onDownloadAll: () => void;

  /**
   * Callback fired when user closes the gallery (Esc key or close button)
   * Receives MouseEvent from button click
   * @type {() => void}
   * @required
   */
  onClose: () => void;

  /**
   * Optional callback for opening settings panel
   * If undefined, settings button will not render
   * @type {(() => void) | undefined}
   * @default undefined
   */
  onOpenSettings?: () => void;

  /**
   * @section View Mode Props
   */

  /**
   * Current view/display mode of the gallery
   * Controls which media is displayed (e.g., 'fit', 'original')
   * @type {ViewMode | undefined}
   * @default undefined
   */
  currentViewMode?: ViewMode;

  /**
   * Callback fired when user changes view mode (e.g., original, fit, etc.)
   * @type {((mode: ViewMode) => void) | undefined}
   * @default undefined
   */
  onViewModeChange?: (mode: ViewMode) => void;

  /**
   * @section Fit Mode Props
   */

  /**
   * Callback fired when user clicks "fit original" (1:1 zoom) button
   * Optional - if undefined, fit mode buttons won't trigger
   * @type {((event?: Event) => void) | undefined}
   * @default undefined
   */
  onFitOriginal?: (event?: Event) => void;

  /**
   * Callback fired when user clicks "fit width" button
   * Optional - if undefined, fit mode buttons won't trigger
   * @type {((event?: Event) => void) | undefined}
   * @default undefined
   */
  onFitWidth?: (event?: Event) => void;

  /**
   * Callback fired when user clicks "fit height" button
   * Optional - if undefined, fit mode buttons won't trigger
   * @type {((event?: Event) => void) | undefined}
   * @default undefined
   */
  onFitHeight?: (event?: Event) => void;

  /**
   * Callback fired when user clicks "fit container" button
   * Optional - if undefined, fit mode buttons won't trigger
   * @type {((event?: Event) => void) | undefined}
   * @default undefined
   */
  onFitContainer?: (event?: Event) => void;

  /**
   * @section UI State Props
   */

  /**
   * Whether toolbar is currently downloading media
   * Shows loading spinner and disables download buttons
   * @type {boolean | undefined}
   * @default false
   */
  isDownloading?: boolean;

  /**
   * Whether toolbar is disabled (all buttons inactive)
   * Typically set during loading or error states
   * @type {boolean | undefined}
   * @default false
   */
  disabled?: boolean;

  /**
   * CSS class name to apply to toolbar root element
   * Allows custom styling and theming overrides
   * @type {string | undefined}
   * @default ''
   */
  className?: string;

  /**
   * Position of toolbar on screen
   * Currently used for responsive layout adjustments
   * @type {'top' | 'bottom' | 'left' | 'right' | undefined}
   * @default 'top'
   */
  position?: 'top' | 'bottom' | 'left' | 'right';

  /**
   * @section Accessibility Props
   */

  /**
   * ARIA label for the toolbar element
   * Provides context for screen reader users
   * @type {string | undefined}
   * @default 'Gallery toolbar'
   */
  'aria-label'?: string;

  /**
   * ARIA describedby for additional accessible description
   * References element ID containing extended description
   * @type {string | undefined}
   * @default undefined
   */
  'aria-describedby'?: string;

  /**
   * Semantic HTML role (typically 'toolbar')
   * Defines component purpose for assistive technologies
   * @type {'toolbar' | undefined}
   * @default 'toolbar'
   */
  role?: 'toolbar';

  /**
   * Tab index for keyboard navigation
   * Controls tab order and focusability
   * @type {number | undefined}
   * @default 0
   */
  tabIndex?: number;

  /**
   * Data attribute for testing and automation
   * Helps identify toolbar in test environments
   * @type {string | undefined}
   * @default undefined
   */
  'data-testid'?: string;

  /**
   * @section Event Handlers for Advanced Integration
   */

  /**
   * Callback fired when toolbar receives focus
   * Useful for custom focus management
   * @type {((event: FocusEvent) => void) | undefined}
   * @default undefined
   */
  onFocus?: (event: FocusEvent) => void;

  /**
   * Callback fired when toolbar loses focus
   * Useful for custom blur handling
   * @type {((event: FocusEvent) => void) | undefined}
   * @default undefined
   */
  onBlur?: (event: FocusEvent) => void;

  /**
   * Callback fired when user presses a key while toolbar is focused
   * Enables custom keyboard shortcut handling
   * @type {((event: KeyboardEvent) => void) | undefined}
   * @default undefined
   */
  onKeyDown?: (event: KeyboardEvent) => void;

  /**
   * @section Tweet Panel Props
   */

  /**
   * Plain text content of the tweet
   * Displayed in expandable tweet panel when tweet button clicked
   * @type {string | undefined}
   * @default undefined
   */
  tweetText?: string | undefined;

  /**
   * Sanitized HTML content of the tweet
   * Preferred over tweetText if provided (already DOM-safe)
   * @type {string | undefined}
   * @default undefined
   */
  tweetTextHTML?: string | undefined;
}

/**
 * @type GalleryToolbarProps
 * @description Type alias for ToolbarProps for consistency with naming conventions
 * May be used in gallery-specific contexts where semantic clarity is needed
 *
 * @example
 * ```typescript
 * type GalleryProps = {
 *   toolbar: GalleryToolbarProps;
 *   gallery: GalleryDisplayProps;
 * };
 * ```
 */
export type GalleryToolbarProps = ToolbarProps;
