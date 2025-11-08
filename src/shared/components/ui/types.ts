/**
 * @fileoverview UI Component Standard Type Definitions
 * @description Shared type interfaces for all UI components
 * @version 3.1.0 - Phase 398: Comprehensive English documentation, design system integration
 * @module shared/components/ui/types
 *
 * **Type System Architecture** (Phase 45+):
 * Central export point for standard component type interfaces.
 * All types inherit from base interfaces in `@shared/types/app.types` and extend
 * with UI-specific properties (size, variant, position, etc.).
 *
 * **Type Categories**:
 *
 * ### Button Interface (StandardButtonProps)
 * Button component configuration type
 * - **Parent Types**: InteractiveComponentProps, SizedComponentProps, VariantComponentProps, FormComponentProps
 * - **Capabilities**: Full interactive, sizing, styling, form integration
 * - **Use Cases**: Primary action buttons, secondary actions, danger zones
 * - **Semantics**: Inherits all standard props (click handlers, disabled, disabled, className)
 *
 * ### Toast Interface (StandardToastProps)
 * Notification component configuration
 * - **Type Options**: 'info' | 'warning' | 'error' | 'success'
 * - **Accessibility**: ARIA roles for screen readers (alert, status, log)
 * - **Display Control**: Auto-dismiss timeout, manual close
 * - **Callbacks**: onClose for cleanup after notification
 *
 * ### Toast Container Interface (StandardToastContainerProps)
 * Notification aggregator container
 * - **Position Options**: 9 positions (top/bottom × left/center/right)
 * - **Stacking Control**: maxToasts limits visible notifications
 * - **Parent**: BaseComponentProps (className, children, etc.)
 *
 * ### Toolbar Interface (StandardToolbarProps)
 * Gallery media control toolbar configuration
 * - **Navigation**: currentIndex, totalCount, onPrevious/onNext
 * - **Download**: onDownloadCurrent, onDownloadAll, isDownloading
 * - **Display**: currentViewMode, position (top/bottom/left/right)
 * - **Callbacks**: onClose, onOpenSettings, onViewModeChange
 * - **State**: disabled flag for interaction control
 *
 * ## Design System Integration
 *
 * **Type Inheritance Chain**:
 * ```
 * BaseComponentProps
 *   ├─ InteractiveComponentProps (click, disabled, aria-label)
 *   ├─ SizedComponentProps (size: sm | md | lg | xl)
 *   ├─ VariantComponentProps (variant: primary | secondary | outline)
 *   └─ FormComponentProps (name, value, onChange)
 * ```
 *
 * **Size Semantics**:
 * - sm: Small (16px-24px) - Icon buttons, compact lists
 * - md: Medium (24px-32px) - Default, standard UI
 * - lg: Large (32px-48px) - Prominent actions
 * - xl: Extra Large (48px-64px) - Call-to-action buttons
 *
 * **Variant Semantics**:
 * - primary: Brand color, main action (blue)
 * - secondary: Supporting color, secondary action (light blue)
 * - outline: Outlined style, minimal emphasis (border only)
 * - danger: Destructive action (red) - deletions, warnings
 * - success: Affirmative action (green) - confirmations
 * - warning: Caution message (amber)
 * - ghost: Transparent, text-only (no background)
 *
 * **Position Options** (Toolbar):
 * - top: Above content (default)
 * - bottom: Below content (fixed)
 * - left: Side panel layout
 * - right: Side panel layout
 *
 * **Notification Types** (Toast):
 * - success: Green background, checkmark icon
 * - error: Red background, X icon, alert role
 * - warning: Amber background, exclamation icon
 * - info: Blue background, info icon, status role
 *
 * ## Usage Patterns
 *
 * ### Button Props Example
 * ```typescript
 * import type { StandardButtonProps } from '@shared/components/ui/types';
 *
 * interface MyButtonProps extends StandardButtonProps {
 *   onClick: () => void;
 * }
 *
 * // Component supports:
 * // - Size: size="sm" | "md" | "lg" | "xl"
 * // - Variant: variant="primary" | "secondary" | "danger"
 * // - Interactive: disabled, aria-label, onClick
 * // - Form: name, value (if used in forms)
 * ```
 *
 * ### Toast Configuration Example
 * ```typescript
 * import type { StandardToastProps } from '@shared/components/ui/types';
 *
 * const successNotification: StandardToastProps = {
 *   type: 'success',
 *   title: 'Download Complete',
 *   message: 'All images downloaded successfully',
 *   duration: 3000,
 *   autoClose: true,
 *   role: 'status',
 * };
 * ```
 *
 * ### Toolbar Integration Example
 * ```typescript
 * import type { StandardToolbarProps } from '@shared/components/ui/types';
 *
 * interface GalleryToolbarProps extends StandardToolbarProps {
 *   fitMode?: 'contain' | 'cover' | 'fill';
 * }
 * ```
 *
 * ## Accessibility Integration
 *
 * **ARIA Support**:
 * - Button: aria-label (from InteractiveComponentProps)
 * - Toast: role (alert/status/log), aria-live
 * - Toolbar: Semantic nav element, keyboard navigation
 *
 * **Screen Reader Compatibility**:
 * - All text content in accessible elements
 * - Semantic HTML structure (button, nav, article)
 * - ARIA descriptions for icon-only controls
 * - Focus management with visible rings
 *
 * **Keyboard Navigation**:
 * - Tab through interactive elements
 * - Enter/Space to activate buttons
 * - Arrow keys for carousel/list navigation
 * - Escape to dismiss modals/toasts
 *
 * ## Type System Benefits
 *
 * **Compile-Time Safety**:
 * - Typo prevention (size, variant, position)
 * - Exhaustiveness checking (TypeScript strict)
 * - IDE autocomplete for props
 * - Refactoring support (safe rename)
 *
 * **Runtime Flexibility**:
 * - Component composition (extend types)
 * - Props spreading (JSX spread operator)
 * - Optional chaining (?.)
 * - Type guards and assertions
 *
 * **Documentation Value**:
 * - Clear prop semantics
 * - Default behavior specifications
 * - Callback signatures
 * - State management patterns
 *
 * ## Related Types
 *
 * **Parent Types** (from @shared/types/app.types):
 * - BaseComponentProps: className, children, role, aria-*
 * - InteractiveComponentProps: onClick, disabled, aria-label
 * - SizedComponentProps: size enum
 * - VariantComponentProps: variant enum
 * - FormComponentProps: name, value, onChange
 *
 * **Component-Specific Types**:
 * - ButtonProps: StandardButtonProps + onClick
 * - IconProps: Icon registry lookup, size
 * - ToolbarProps: StandardToolbarProps + gallery-specific
 * - ToastProps: StandardToastProps + duration management
 *
 * ## Testing Strategy
 *
 * **Type Checking**:
 * - Component accepts correct props
 * - Rejects invalid prop values
 * - Handles optional props correctly
 *
 * **Runtime Tests**:
 * - Prop passing propagates to DOM
 * - Event handlers fire correctly
 * - Styling applies based on size/variant
 *
 * **Integration Tests**:
 * - Types compose correctly
 * - Inheritance chains work
 * - Props flow through component hierarchy
 *
 * ## Future Enhancements
 *
 * **Type System Improvements**:
 * - Conditional types for prop validation
 * - Branded types for size/variant safety
 * - Generic type parameters for flexibility
 *
 * **Component Expansion**:
 * - Input/select/checkbox types
 * - Menu/dropdown types
 * - Alert/dialog types
 *
 * **Documentation**:
 * - Storybook integration for prop tables
 * - Type-driven API documentation
 * - IDE hover documentation
 *
 * ## Related Documentation
 * - {@link ./constants} - Size/variant constant definitions
 * - {@link ./Button/Button} - Button component implementation
 * - {@link ./Toast/Toast} - Toast component implementation
 * - {@link ../../types/app.types} - Base type definitions
 * - {@link ../../../../docs/ARCHITECTURE.md} - System architecture
 * - {@link ../../../../docs/CODING_GUIDELINES.md} - Type guidelines
 *
 * @see {@link ../../types/app.types} - Parent type definitions
 * @see {@link ./constants} - Size and variant constant values
 * @see {@link ./Button} - Button component that uses StandardButtonProps
 */

import type {
  BaseComponentProps,
  InteractiveComponentProps,
  SizedComponentProps,
  VariantComponentProps,
  FormComponentProps,
} from '../../types/app.types';

/**
 * Standard Button Component Props
 * @description Complete button configuration interface
 *
 * **Inheritance**:
 * - InteractiveComponentProps: onClick, disabled, aria-label
 * - SizedComponentProps: size (sm | md | lg | xl)
 * - VariantComponentProps: variant (primary | secondary | outline | danger | success | warning | ghost)
 * - FormComponentProps: name, value, onChange (for form integration)
 *
 * **Type Safety**:
 * - All size values validated at compile-time
 * - All variant values validated at compile-time
 * - Event handlers have correct signatures
 * - Form props compatible with native form APIs
 *
 * **Semantics**:
 * This type represents a semantic button element with full interactivity support.
 * Used for action buttons, navigation buttons, form controls, and icon buttons.
 *
 * **Example**:
 * ```typescript
 * const buttonProps: StandardButtonProps = {
 *   size: 'md',
 *   variant: 'primary',
 *   onClick: () => handleAction(),
 *   disabled: false,
 *   'aria-label': 'Save changes',
 * };
 * ```
 *
 * @see {@link ./Button/Button} - Button component implementation
 * @see {@link ./constants} - Size and variant constants
 */
export interface StandardButtonProps
  extends InteractiveComponentProps,
    SizedComponentProps,
    VariantComponentProps,
    FormComponentProps {}

/**
 * Standard Toast Notification Props
 * @description Transient notification component configuration
 *
 * **Type Field** (Required):
 * - 'success': Green notification (checkmark), status role
 * - 'error': Red notification (X icon), alert role
 * - 'warning': Amber notification (exclamation), alert role
 * - 'info': Blue notification (info icon), status role
 *
 * **Content Fields** (Required):
 * - title: Main message text (always visible)
 * - message: Detailed description text
 *
 * **Control Fields** (Optional):
 * - duration: Auto-dismiss timeout in milliseconds (default: 3000)
 * - autoClose: Enable auto-dismiss (default: true)
 * - onClose: Callback when toast dismissed
 * - role: ARIA role for screen readers (alert | status | log)
 *
 * **Accessibility**:
 * - role=alert for errors/warnings (interrupting)
 * - role=status for success/info (non-interrupting)
 * - aria-live region management
 * - Keyboard dismissible (ESC key)
 *
 * **Semantics**:
 * Notifications are temporary status messages displayed to the user.
 * Color immediately communicates outcome (green=success, red=error, etc.).
 * Users should be able to dismiss or let auto-dismiss.
 *
 * **Example**:
 * ```typescript
 * const successToast: StandardToastProps = {
 *   type: 'success',
 *   title: 'Download Complete',
 *   message: '5 images downloaded to ~/Downloads',
 *   duration: 4000,
 *   autoClose: true,
 *   role: 'status',
 * };
 * ```
 *
 * @see {@link ./Toast/Toast} - Toast component implementation
 * @see {@link ./constants} - DEFAULT_TOAST_TYPES constant values
 */
export interface StandardToastProps extends BaseComponentProps {
  /** Notification type (communicates intent) */
  type: 'info' | 'warning' | 'error' | 'success';

  /** Primary message text (always visible) */
  title: string;

  /** Detailed description text */
  message: string;

  /** Auto-dismiss timeout in milliseconds (default: 3000) */
  duration?: number;

  /** Enable auto-dismiss after duration (default: true) */
  autoClose?: boolean;

  /** Callback when toast is dismissed */
  onClose?: () => void;

  /** ARIA role for screen readers and live regions */
  role?: 'alert' | 'status' | 'log';
}

/**
 * Standard Toast Container Props
 * @description Toast notification aggregator and manager configuration
 *
 * **Position Options**:
 * - top-left: Upper left corner
 * - top-right: Upper right corner (default)
 * - top-center: Top center
 * - bottom-left: Lower left corner
 * - bottom-right: Lower right corner
 * - bottom-center: Bottom center
 *
 * **Stacking Behavior**:
 * - Multiple toasts stack vertically
 * - maxToasts limits visible count
 * - Older toasts pushed out when limit reached
 * - Each toast still auto-dismisses independently
 *
 * **Semantics**:
 * Container manages the life cycle and layout of multiple toast notifications.
 * Typically one container per app (top-right corner is standard).
 * Animations (slide-in/fade-out) handled by container.
 *
 * **Example**:
 * ```typescript
 * const containerProps: StandardToastContainerProps = {
 *   position: 'top-right',
 *   maxToasts: 5,
 *   className: 'custom-toast-container',
 * };
 * ```
 *
 * @see {@link ./Toast/ToastContainer} - Container implementation
 */
export interface StandardToastContainerProps extends BaseComponentProps {
  /** Maximum toasts to display simultaneously (default: 5) */
  maxToasts?: number;

  /** Position on screen where toasts appear */
  position?:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-center'
    | 'bottom-center';
}

/**
 * Standard Toolbar Props
 * @description Gallery media control toolbar configuration
 *
 * **Navigation** (Required):
 * - currentIndex: Current media item (0-based)
 * - totalCount: Total media items
 * - onPrevious: Navigate to previous item
 * - onNext: Navigate to next item
 *
 * **Download** (Required):
 * - onDownloadCurrent: Download single media
 * - onDownloadAll: Download all media
 *
 * **Display** (Optional):
 * - currentViewMode: Current fit mode (contain/cover/fill)
 * - onViewModeChange: Fit mode change callback
 * - position: Toolbar placement (top/bottom/left/right)
 *
 * **State** (Optional):
 * - isDownloading: Disable controls during download
 * - disabled: Disable all interaction
 * - onOpenSettings: Settings access callback
 * - onClose: Exit gallery callback
 *
 * **Semantics**:
 * Toolbar provides media navigation, view controls, and download functionality.
 * Designed for PC-only use (no touch/pointer events).
 * Auto-hides during inactivity with manual activation.
 *
 * **Example**:
 * ```typescript
 * const toolbarProps: StandardToolbarProps = {
 *   currentIndex: 0,
 *   totalCount: 5,
 *   isDownloading: false,
 *   position: 'bottom',
 *   onPrevious: () => setIndex(i => i - 1),
 *   onNext: () => setIndex(i => i + 1),
 *   onDownloadCurrent: () => downloadSingle(currentIndex),
 *   onDownloadAll: () => downloadAll(),
 *   onClose: () => closeGallery(),
 *   onOpenSettings: () => showSettings(),
 * };
 * ```
 *
 * @see {@link ./Toolbar/Toolbar} - Toolbar component implementation
 * @see {@link ../../types/toolbar.types} - Extended gallery-specific types
 */
export interface StandardToolbarProps extends BaseComponentProps {
  /** Current media index (0-based, 0 = first item) */
  currentIndex: number;

  /** Total media count (for display and bounds checking) */
  totalCount: number;

  /** Download in progress flag (disables controls) */
  isDownloading?: boolean;

  /** Disable all interaction (override isDownloading) */
  disabled?: boolean;

  /** Current view fit mode (contain | cover | fill) */
  currentViewMode?: string;

  /** Fit mode change callback */
  onViewModeChange?: (mode: string) => void;

  /** Navigate to previous media */
  onPrevious: () => void;

  /** Navigate to next media */
  onNext: () => void;

  /** Download current media item */
  onDownloadCurrent: () => void;

  /** Download all media items (triggers bulk download) */
  onDownloadAll: () => void;

  /** Close toolbar/exit gallery */
  onClose: () => void;

  /** Open settings modal callback */
  onOpenSettings?: () => void;

  /** Toolbar position on screen */
  position?: 'top' | 'bottom' | 'left' | 'right';
}
