/**
 * @fileoverview Toast Component - Individual Notification Display
 * @version 1.0.0 - Phase 393: Toast notification component optimization
 * @description Presents a single toast notification with title, message, optional action button,
 * and close functionality. Supports 4 types: info, success, warning, error.
 * @module shared/components/ui/Toast
 *
 * **Toast Component Architecture** (Phase 385+):
 * Single notification display with glassmorphism design and smooth animations.
 * Integrated with UnifiedToastManager for state/lifecycle management.
 *
 * **Props Contract**:
 * - toast: ToastItem (required) - Data from UnifiedToastManager
 * - onRemove: (id: string) => void (required) - Callback to remove notification
 * - className?: string - Additional CSS classes
 * - data-testid?: string - Testing identifier
 * - aria-label?: string - Accessibility label
 * - role?: 'alert' | 'status' | 'log' - ARIA role (default: 'alert')
 *
 * **Lifecycle Management**:
 * 1. Mount: Sets up auto-dismiss timer via globalTimerManager
 * 2. Render: Displays notification with content/actions
 * 3. Cleanup: Clears timer and removes notification on cleanup or action
 * 4. Unmount: All resources freed by Solid.js reactivity
 *
 * **Design System Integration**:
 * - All colors via design tokens (--xeg-toast-*, --xeg-color-*)
 * - Animations: Slide-in via CSS keyframes
 * - Typography: em-based font sizing (scalable, accessible)
 * - Spacing: Consistent via --xeg-toast-* tokens
 * - Responsive: Adapts to mobile/desktop via media queries
 *
 * **Accessibility Features**:
 * - role="alert" for urgent notifications (or role="status" for non-urgent)
 * - aria-label: Descriptive label combining type and title
 * - Semantic button elements with proper labels
 * - Color-coded borders (not only color dependency)
 * - Icon support (unicode emoji) with aria-hidden="true"
 * - Focus management for close/action buttons
 * - WCAG 2.1 Level AA compliant
 *
 * **Toast Types** (Color-coded):
 * - info: 🟦 Blue (informational, default role=status)
 * - success: 🟩 Green (operation succeeded, role=alert)
 * - warning: 🟨 Amber (caution required, role=alert)
 * - error: 🟥 Red (critical issue, role=alert)
 *
 * **Icon Mapping**:
 * - info: 'ℹ️' (U+2139)
 * - success: '✅' (U+2705)
 * - warning: '⚠️' (U+26A0 + Variation Selector)
 * - error: '❌' (U+274C)
 * - default: '🔔' (U+1F514)
 *
 * **Action Button Features**:
 * - Optional actionText + onAction callback
 * - Click: Executes onAction, then removes notification
 * - Styled with primary color (glassmorphism design)
 * - Keyboard accessible (Space/Enter)
 * - Prevents event bubbling via stopPropagation
 *
 * **Timer Management**:
 * - Uses globalTimerManager (Phase 383) for safety
 * - Duration from toast.duration (milliseconds)
 * - Auto-clears on unmount (no memory leaks)
 * - Cleared when notification removed or action triggered
 *
 * **State Ownership**:
 * - UI Component: Display only (no state)
 * - UnifiedToastManager: State management (toasts[], add/remove/clear)
 * - GlobalTimerManager: Timer lifecycle (no manual setTimeout cleanup)
 *
 * **Performance Optimizations**:
 * - Solid.js reactivity (no unnecessary re-renders)
 * - CSS Modules (scoped styles, no conflicts)
 * - Icon: Pre-calculated in getToastIcon()
 * - ClassName: Built once via createClassName()
 * - Event handlers: Stable via closure
 *
 * **Testing Strategy**:
 * - Unit: Toast rendering, timer behavior, event handling
 * - Integration: With ToastContainer + UnifiedToastManager
 * - E2E: Toast display, dismiss, action buttons, accessibility
 *
 * **Component Example**:
 * ```tsx
 * import { Toast } from '@shared/components/ui/Toast';
 *
 * const toast: ToastItem = {
 *   id: 'abc123',
 *   type: 'success',
 *   title: 'Download Complete',
 *   message: 'Your file has been downloaded.',
 *   duration: 3000,
 *   actionText: 'Undo',
 *   onAction: () => console.log('Undo clicked'),
 * };
 *
 * <Toast toast={toast} onRemove={id => manager.remove(id)} />
 * ```
 *
 * **Related Components**:
 * - ToastContainer: Manages multiple toasts layout
 * - UnifiedToastManager: Service for toast state
 * - NotificationService: Creates toasts via GM_notification (legacy)
 *
 * **Design Tokens Used**:
 * - Colors: --xeg-toast-bg-*, --xeg-color-primary, --xeg-color-*
 * - Animation: --xeg-duration-*, --xeg-easing-*
 * - Spacing: --xeg-toast-*, --xeg-radius-*
 * - Typography: --xeg-toast-title-*, --xeg-toast-message-*
 *
 * **Browser Compatibility**:
 * - CSS Modules: All modern browsers
 * - Flexbox: Full support
 * - CSS Variables: IE 11 not supported
 * - Animation: GPU-accelerated
 * - Unicode emoji: Universal support (fallback text available)
 *
 * **Future Enhancements**:
 * - Swipe-to-dismiss on mobile
 * - Stacking position variants (top-left, bottom-center, etc.)
 * - Custom icon support (SVG or component)
 * - Rich content (nested HTML, not just text)
 * - Pause-on-hover auto-dismiss timer
 *
 * @see {@link ./Toast.module.css} - Glassmorphism toast styles
 * @see {@link ./ToastContainer.tsx} - Multiple toasts container
 * @see {@link @shared/services/unified-toast-manager.ts} - Toast state management
 * @see {@link @shared/utils/timer-management.ts} - Global timer management
 * @see {@link ../types/index.ts} - Toast type definitions
 */

import { getSolid, type JSXElement } from '@shared/external/vendors';
import { createClassName, createTestProps } from '@shared/utils/component-utils';
import type { StandardToastProps } from '../types';
import type { ToastItem as ServiceToastItem } from '@/shared/services/unified-toast-manager';
import { globalTimerManager } from '@shared/utils/timer-management';
import styles from './Toast.module.css';

// ============================================================================
// Types
// ============================================================================

/**
 * @interface ToastItem
 * @description Toast data contract - extends service's ToastItem to prevent drift
 * between UI expectations and service reality. By centralizing the type here,
 * we make it clear this is the "source of truth" for Toast component.
 * @example
 * const toast: ToastItem = {
 *   id: 'unique-id',
 *   type: 'success',
 *   title: 'Success!',
 *   message: 'Operation completed',
 *   duration: 3000,
 *   actionText?: 'Undo',
 *   onAction?: () => { ... },
 * };
 */
export interface ToastItem extends ServiceToastItem {}

/**
 * @interface ToastSpecificProps
 * @description Props specific to Toast component (not shared with ToastContainer)
 * @prop {ToastItem} toast - Toast data from service
 * @prop {(id: string) => void} onRemove - Callback to remove notification
 */
interface ToastSpecificProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

/**
 * @interface ToastProps
 * @description Complete props for Toast component
 * @extends StandardToastProps - Standard UI props (className, data-testid, etc.)
 * @extends ToastSpecificProps - Toast-specific props (toast, onRemove)
 * @prop {ToastItem} toast - Required after merge
 * @prop {(id: string) => void} onRemove - Required after merge
 * @example
 * <Toast
 *   toast={toast}
 *   onRemove={handleRemove}
 *   className="custom-class"
 *   aria-label="Success notification"
 * />
 */
export interface ToastProps extends Partial<StandardToastProps>, Partial<ToastSpecificProps> {
  // After merge, both toast and onRemove are required (enforced by runtime check)
  toast?: ToastItem;
  onRemove?: (id: string) => void;
}

const { createEffect, onCleanup } = getSolid();

// ============================================================================
// Constants
// ============================================================================

/**
 * @constant TOAST_ICON_MAP
 * @description Icon emoji for each toast type
 * - info: Info symbol (ℹ️ U+2139)
 * - success: Check mark (✅ U+2705)
 * - warning: Warning symbol (⚠️ U+26A0)
 * - error: Cross mark (❌ U+274C)
 * - default: Bell (🔔 U+1F514)
 */
const TOAST_ICON_MAP: Record<string, string> & { default: string } = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  default: '🔔',
};

/**
 * @constant TOAST_TYPE_DEFAULTS
 * @description Default role by toast type for semantic HTML
 * - info, default: role="status" (non-urgent)
 * - success, warning, error: role="alert" (user attention required)
 */
const TOAST_TYPE_DEFAULTS: Record<string, 'alert' | 'status' | 'log'> & {
  default: 'alert' | 'status' | 'log';
} = {
  info: 'status',
  default: 'status',
  success: 'alert',
  warning: 'alert',
  error: 'alert',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Toast Component - Individual Notification Display
 *
 * Renders a single toast notification with the following features:
 * - Type-based icon and color (info/success/warning/error)
 * - Title and message content
 * - Optional action button
 * - Close button (X)
 * - Auto-dismiss timer (via globalTimerManager)
 * - Full accessibility support (ARIA, keyboard, screen readers)
 *
 * **Lifecycle**:
 * 1. On mount: Sets up auto-dismiss timer if duration > 0
 * 2. On cleanup: Clears timer to prevent memory leaks
 * 3. On remove: Calls onRemove callback (handled by parent ToastContainer)
 * 4. On action: Executes onAction callback, then removes toast
 *
 * **Safety Checks**:
 * - Requires both toast and onRemove props (throws if missing)
 * - Safely handles missing optional fields (actionText, onAction, duration)
 * - Protects against event bubbling (stopPropagation on close/action)
 *
 * **Styling**:
 * - Type-specific CSS class (info/success/warning/error)
 * - Additional className prop for customization
 * - All styles scoped via CSS Modules
 * - Glassmorphism design via design tokens
 *
 * **Accessibility**:
 * - Semantic ARIA role (alert/status/log)
 * - Descriptive aria-label combining type and title
 * - Icon marked as aria-hidden (non-semantic)
 * - Buttons with clear labels ("Close", action text)
 * - Focus management for keyboard users
 * - Color-coded borders (not only color dependency)
 *
 * @param props - ToastProps containing toast data, remove callback, and UI options
 * @returns JSXElement - Rendered toast notification
 * @throws Error if toast or onRemove props are missing
 *
 * @example
 * ```tsx
 * import { Toast } from '@shared/components/ui/Toast';
 *
 * const toast: ToastItem = {
 *   id: 'notify-1',
 *   type: 'success',
 *   title: 'Download Complete',
 *   message: 'Your file has been saved.',
 *   duration: 3000,
 *   actionText: 'Undo',
 *   onAction: () => console.log('User clicked Undo'),
 * };
 *
 * <Toast
 *   toast={toast}
 *   onRemove={id => manager.remove(id)}
 *   className="custom-toast"
 *   aria-label="Success: Download Complete"
 * />
 * ```
 */
export function Toast({
  toast,
  onRemove,
  className,
  'data-testid': testId,
  'aria-label': ariaLabel,
  role,
}: ToastProps): JSXElement {
  // ========================================================================
  // Safety Checks
  // ========================================================================

  if (!toast || !onRemove) {
    throw new Error(
      'Toast component requires both toast and onRemove props. ' +
        'Ensure ToastContainer is using UnifiedToastManager correctly.'
    );
  }

  // ========================================================================
  // Auto-Dismiss Timer Management
  // ========================================================================

  /**
   * Sets up auto-dismiss timer using globalTimerManager (Phase 383)
   * Benefits of globalTimerManager:
   * - Centralized timer tracking (no leaked timers)
   * - Automatic cleanup on component unmount
   * - No manual setTimeout/clearTimeout (error-prone)
   * - Compatible with Solid.js reactivity
   */
  createEffect(() => {
    // Skip timer if no duration or duration <= 0
    if (!toast.duration || toast.duration <= 0) {
      return;
    }

    // Register timeout with manager
    const timer = globalTimerManager.setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration);

    // Cleanup: Called when effect re-runs or component unmounts
    onCleanup(() => {
      globalTimerManager.clearTimeout(timer);
    });
  });

  // ========================================================================
  // Event Handlers
  // ========================================================================

  /**
   * Handles close button click
   * - Stops event propagation (prevents parent click handlers)
   * - Removes notification via onRemove callback
   * - Cancels auto-dismiss timer (globalTimerManager handles this)
   */
  const handleClose = (event: Event): void => {
    event.stopPropagation();
    onRemove(toast.id);
  };

  /**
   * Handles action button click
   * - Stops event propagation
   * - Executes user's onAction callback (if provided)
   * - Removes notification after action
   * Example use: "Undo" button that reverses previous operation
   */
  const handleAction = (event: Event): void => {
    event.stopPropagation();
    toast.onAction?.();
    onRemove(toast.id);
  };

  // ========================================================================
  // Helper Functions
  // ========================================================================

  /**
   * Retrieves icon emoji for toast type
   * @returns Icon string (emoji) for the toast type
   * Maps: info→ℹ️, success→✅, warning→⚠️, error→❌, other→🔔
   */
  const getToastIcon = (): string => {
    const icon = TOAST_ICON_MAP[toast.type];
    return icon !== undefined ? icon : TOAST_ICON_MAP.default;
  };

  /**
   * Resolves ARIA role for toast
   * Determines semantic role based on toast type
   * - info/default: "status" (non-urgent, assistive tech notified)
   * - success/warning/error: "alert" (urgent, user attention required)
   * Can be overridden by props.role
   */
  const resolveRole = (): 'alert' | 'status' | 'log' => {
    if (role) return role;
    const defaultRole = TOAST_TYPE_DEFAULTS[toast.type];
    return defaultRole !== undefined ? defaultRole : TOAST_TYPE_DEFAULTS.default;
  };

  /**
   * Generates descriptive ARIA label
   * Format: "{type}: {title}"
   * Used for accessibility when aria-label prop not provided
   * Example: "success: Download Complete"
   */
  const generateAriaLabel = (): string => {
    return `${toast.type}: ${toast.title}`;
  };

  // ========================================================================
  // Styling
  // ========================================================================

  /**
   * Combines toast base class with type-specific class
   * Example: [styles.toast] + [styles.success] + [custom-class]
   * Scoped via CSS Modules (no naming conflicts)
   */
  const toastClass = createClassName(styles.toast, styles[toast.type], className);

  /**
   * Generates test attributes for E2E/unit testing
   * Helps testing frameworks identify Toast elements
   */
  const testProps = createTestProps(testId);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div
      class={toastClass}
      role={resolveRole()}
      aria-label={ariaLabel ?? generateAriaLabel()}
      {...testProps}
      data-toast-type={toast.type}
      data-toast-id={toast.id}
    >
      {/* Content wrapper: Flex column layout */}
      <div class={styles.content}>
        {/* Header: Icon, title, close button */}
        <div class={styles.header}>
          {/* Icon: Type-specific emoji (hidden from screen readers) */}
          <span class={styles.icon} aria-hidden='true'>
            {getToastIcon()}
          </span>

          {/* Title: Main heading (h4 for semantic structure) */}
          <h4 class={styles.title}>{toast.title}</h4>

          {/* Close button: Dismiss notification */}
          <button
            type='button'
            class={styles.closeButton}
            onClick={handleClose}
            aria-label='Close notification'
            title='Close this notification'
          >
            ×
          </button>
        </div>

        {/* Message: Secondary text content */}
        <p class={styles.message}>{toast.message}</p>

        {/* Action button: Optional user action (e.g., "Undo", "Retry") */}
        {toast.actionText && toast.onAction && (
          <div class={styles.actions}>
            <button
              type='button'
              class={styles.actionButton}
              onClick={handleAction}
              aria-label={`Perform action: ${toast.actionText}`}
            >
              {toast.actionText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
