/**
 * @fileoverview Toast Container Component - Multiple Notifications Manager
 * @version 1.0.0 - Phase 393: Toast container component optimization
 * @description Manages and displays multiple toast notifications in a grid layout.
 * Positions toasts at configurable corners (top-right, top-left, etc.) with
 * stacking and overflow management. Integrates with UnifiedToastManager for state.
 * @module shared/components/ui/Toast
 *
 * **ToastContainer Component Architecture** (Phase 385+):
 * Fixed position container that renders multiple Toast components.
 * Handles layout, stacking, and max toast limiting.
 *
 * **Props Contract**:
 * - position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
 *   (default: 'top-right') - Container positioning on screen
 * - maxToasts?: number (default: 5) - Maximum visible toasts (older toasts hidden)
 * - className?: string - Additional CSS classes
 * - data-testid?: string - Testing identifier
 * - aria-label?: string - Container label for screen readers
 * - aria-describedby?: string - Describes container purpose
 * - role?: string (default: 'region') - ARIA role
 * - tabIndex?: number - Tab order (if interactive)
 * - Event handlers: onFocus, onBlur, onKeyDown
 *
 * **Container Positioning**:
 * - Fixed position: stays in viewport even when scrolling
 * - 4 positions: top-right (default), top-left, bottom-right, bottom-left
 * - z-index: Uses --xeg-z-toast token (above most content)
 * - Padding: Respects --xeg-toast-offset token (16px typical)
 * - Responsive: Adapts to mobile/tablet/desktop via media queries
 *
 * **State Management**:
 * - Toasts from UnifiedToastManager.signal (reactive)
 * - Automatic limiting via useSelector (maxToasts count)
 * - No local state (all state managed by service)
 * - Dependencies: length, maxToasts (for caching)
 *
 * **Rendering Strategy**:
 * - Uses Solid.js <For> component (keyed by toast.id)
 * - Efficiently handles add/remove/reorder
 * - Each Toast gets: toast data + onRemove callback
 * - onRemove calls: toastManager.remove(id)
 *
 * **Accessibility Features**:
 * - role="region" (landmark for screen readers)
 * - aria-live="polite" (announces toasts without interrupting)
 * - aria-atomic="false" (only new toast announced)
 * - Descriptive aria-label for container purpose
 * - Optional aria-describedby for detailed description
 * - Keyboard accessible (focus management optional)
 * - WCAG 2.1 Level AA compliant
 *
 * **Event Pointer Management**:
 * - Container: pointer-events: none (doesn't block clicks on background)
 * - Child toasts: pointer-events: auto (receive click events)
 * - Benefit: Toast container doesn't prevent interaction with page
 * - Implementation: CSS rules in ToastContainer.module.css
 *
 * **Styling & Positioning**:
 * - CSS Modules for scoped styles
 * - Position-specific classes: .top-right, .top-left, etc.
 * - All colors/spacing via design tokens
 * - Glassmorphism effects (if applicable to toasts)
 * - Responsive sizing for mobile/desktop
 *
 * **Limiting & Stacking**:
 * - maxToasts: Hides older toasts when limit exceeded
 * - Stacking: CSS flexbox column (vertical stack)
 * - Direction: Depends on position (top grows down, bottom grows up)
 * - Overflow: Scrolls or clips (CSS overflow-y)
 *
 * **Performance Optimizations**:
 * - useSelector: Memoizes limited toasts array
 * - Dependencies: [state.length, maxToasts] (cache key)
 * - Solid.js <For>: Keyed by toast.id (efficient diffing)
 * - CSS Modules: No runtime style calculations
 * - No unnecessary DOM updates (reactive signal)
 *
 * **Testing Strategy**:
 * - Unit: Rendering multiple toasts, limiting, positioning
 * - Integration: With ToastContainer + UnifiedToastManager + Toast
 * - E2E: Toast stacking, remove, update, accessibility
 * - Accessibility: Screen reader announcements, keyboard nav
 *
 * **Component Example**:
 * ```tsx
 * import { ToastContainer } from '@shared/components/ui/Toast';
 *
 * // In app root:
 * <ToastContainer
 *   position="top-right"
 *   maxToasts={5}
 *   aria-label="Application notifications"
 * />
 *
 * // In feature code:
 * import { toastManager } from '@shared/services/unified-toast-manager';
 * toastManager.success('Operation complete!');
 * toastManager.error('Something went wrong', { duration: 5000 });
 * ```
 *
 * **Related Components**:
 * - Toast: Individual notification display
 * - UnifiedToastManager: Service for creating/managing toasts
 * - NotificationService: Legacy notification system (via GM_notification)
 *
 * **Design Tokens Used**:
 * - Layout: --xeg-z-toast, --xeg-toast-offset
 * - Colors: Inherited from Toast component
 * - Animation: Inherited from Toast component (slide-in)
 * - Typography: Inherited from Toast component
 *
 * **Browser Compatibility**:
 * - Fixed position: All modern browsers
 * - Flexbox: Full support
 * - CSS Variables: IE 11 not supported
 * - <For>: Solid.js specific
 * - useSelector: Solid.js utilities
 *
 * **Future Enhancements**:
 * - Touch swipe to dismiss (mobile)
 * - Drag to reorder toasts
 * - Animation variants (slide, fade, pop)
 * - Custom position offsets (responsive config)
 * - Toast grouping (collapse similar types)
 * - Sound notifications (optional)
 *
 * @see {@link ./ToastContainer.module.css} - Container layout styles
 * @see {@link ./Toast.tsx} - Individual toast component
 * @see {@link @shared/services/unified-toast-manager.ts} - Toast service
 * @see {@link @shared/utils/signal-selector.ts} - Memoization utilities
 * @see https://www.w3.org/WAI/WCAG21/Understanding/status-messages - ARIA live regions
 */

import { getSolid, type JSXElement } from '@shared/external/vendors';
import { useSelector } from '@shared/utils/signal-selector';
import { toastManager, type ToastItem } from '@/shared/services/unified-toast-manager';
import { createClassName, createAriaProps, createTestProps } from '@shared/utils/component-utils';
import type { StandardToastContainerProps } from '../types';
import type { BaseComponentProps } from '@shared/types/app.types';
import { Toast } from './Toast';
import styles from './ToastContainer.module.css';

// ============================================================================
// Types
// ============================================================================

/**
 * @interface ToastContainerProps
 * @description Props for ToastContainer component
 * @extends StandardToastContainerProps - Standard UI props
 * @prop {string} position - Container position (top-right, top-left, etc.)
 * @prop {number} maxToasts - Maximum visible toasts (older ones hidden)
 * @prop {string} className - Additional CSS classes
 * @prop {string} data-testid - Testing identifier
 * @prop {string} aria-label - Accessibility label
 * @prop {string} aria-describedby - Description element ID
 * @prop {string} role - ARIA role
 * @prop {number} tabIndex - Tab order
 * @prop {(event: FocusEvent) => void} onFocus - Focus event handler
 * @prop {(event: FocusEvent) => void} onBlur - Blur event handler
 * @prop {(event: KeyboardEvent) => void} onKeyDown - Keyboard event handler
 *
 * @example
 * <ToastContainer
 *   position="top-right"
 *   maxToasts={5}
 *   className="custom-toast-area"
 *   aria-label="System notifications"
 * />
 */
export interface ToastContainerProps extends Partial<StandardToastContainerProps> {
  className?: string;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

const solid = getSolid();
const { mergeProps, splitProps, For } = solid;

// ============================================================================
// Constants
// ============================================================================

/**
 * @constant defaults
 * @description Default prop values for ToastContainer
 * - position: 'top-right' - Default position (most common)
 * - maxToasts: 5 - Limit to 5 visible toasts (older toasts hidden)
 */
const defaults: Required<Pick<ToastContainerProps, 'position' | 'maxToasts'>> = {
  position: 'top-right',
  maxToasts: 5,
};

// ============================================================================
// Component
// ============================================================================

/**
 * ToastContainer Component - Multiple Notifications Manager
 *
 * Renders a collection of Toast components in a fixed position container.
 * Integrates with UnifiedToastManager for reactive state management.
 *
 * **Key Features**:
 * - Fixed position: Stays in viewport during scrolling
 * - Configurable position: top-right, top-left, bottom-right, bottom-left
 * - Limiting: Hides older toasts when exceeding maxToasts
 * - Accessibility: ARIA live region for screen reader announcements
 * - Performance: useSelector memoizes limited toasts array
 * - Pointer events: Allows background clicks via CSS pointer-events
 *
 * **Lifecycle**:
 * 1. Mount: Subscribes to toastManager.signal (reactive)
 * 2. Signal update: useSelector memoizes new toasts if state.length or maxToasts changes
 * 3. Render: Renders Toast for each toast in limitedToasts()
 * 4. User action: Toast calls onRemove → toastManager.remove(id)
 * 5. Unmount: Unsubscribes from signal (Solid.js automatic)
 *
 * **Performance Considerations**:
 * - useSelector: Prevents unnecessary re-renders
 * - Dependencies: [state.length, maxToasts] (cache invalidation key)
 * - <For>: Keyed component, efficient diffing
 * - CSS Modules: No runtime calculations
 * - Memoization name: 'limitedToasts' (for debugging)
 *
 * **Accessibility**:
 * - aria-live="polite" (announces toasts without interrupting)
 * - aria-atomic="false" (only announces new toast, not whole region)
 * - role="region" (landmark for navigation)
 * - Descriptive aria-label (default: "Toast notification container")
 * - Optional aria-describedby (link to description element)
 * - Keyboard support: Optional tabIndex and event handlers
 *
 * **Event Handling**:
 * - onFocus: Called when container gains focus
 * - onBlur: Called when container loses focus
 * - onKeyDown: Keyboard event handler (for custom shortcuts)
 * - Note: Toasts handle their own click events (close, action buttons)
 *
 * @param rawProps - ToastContainerProps (merged with defaults)
 * @returns JSXElement - Fixed position container with Toast components
 *
 * @example
 * ```tsx
 * import { ToastContainer } from '@shared/components/ui/Toast';
 *
 * // In app root (e.g., GalleryApp.tsx):
 * <ToastContainer
 *   position="top-right"
 *   maxToasts={5}
 *   aria-label="Application notifications"
 * />
 *
 * // In any component:
 * import { toastManager } from '@shared/services/unified-toast-manager';
 *
 * await downloadFile(url);
 * toastManager.success('Download complete', {
 *   duration: 3000,
 *   actionText: 'Open',
 *   onAction: () => openFile(),
 * });
 * ```
 *
 * @example
 * ```tsx
 * // With custom styling and accessibility
 * <ToastContainer
 *   position="bottom-right"
 *   maxToasts={3}
 *   className="app-toast-region"
 *   aria-label="System alerts and notifications"
 *   aria-describedby="toast-description"
 *   tabIndex={-1}
 *   onKeyDown={e => e.key === 'Escape' && toastManager.clear()}
 * />
 * ```
 */
export function ToastContainer(rawProps: ToastContainerProps = {}): JSXElement {
  // ========================================================================
  // Props Processing
  // ========================================================================

  /**
   * Merge user props with defaults
   * Solid.js mergeProps: Later props override earlier ones
   * Order: defaults → user props
   */
  const props = mergeProps(defaults, rawProps);

  /**
   * Split props into local (destructured) and rest (passed to <div>)
   * Local props: Handled by component logic
   * Rest props: Passed directly to DOM element
   */
  const [local, rest] = splitProps(props, [
    'className',
    'position',
    'maxToasts',
    'data-testid',
    'aria-label',
    'aria-describedby',
    'role',
    'tabIndex',
    'onFocus',
    'onBlur',
    'onKeyDown',
  ]);

  // ========================================================================
  // State Selection & Memoization
  // ========================================================================

  /**
   * Selects and limits toasts from service signal
   * Phase A5.3: useSelector replaces createMemo for better dependency tracking
   *
   * What it does:
   * 1. Subscribes to toastManager.signal (all toasts from service)
   * 2. Slices array to maxToasts limit (oldest toasts hidden)
   * 3. Memoizes result based on dependencies
   *
   * Dependencies: [state.length, local.maxToasts]
   * - Cache hit if both values unchanged (no re-render)
   * - Cache miss if either changes (re-render with new array)
   *
   * Example:
   * - Signal has 10 toasts, maxToasts=5
   * - Returns first 5 toasts
   * - When 6th toast added, dependencies change, new array returned
   */
  const limitedToasts = useSelector<ToastItem[], ToastItem[]>(
    toastManager.signal,
    state => state.slice(0, local.maxToasts),
    {
      dependencies: state => [state.length, local.maxToasts],
    }
  );

  // ========================================================================
  // CSS Classes
  // ========================================================================

  /**
   * Dynamically combines CSS classes for container
   * Classes: base + position-specific + custom
   * Example: [.container] + [.top-right] + [custom-class]
   * Scoped via CSS Modules (no naming conflicts)
   */
  const containerClass = () =>
    createClassName(
      styles.container,
      styles[local.position] || styles['top-right'],
      local.className
    );

  // ========================================================================
  // Accessibility Props
  // ========================================================================

  /**
   * Build ARIA properties object
   * Includes: aria-label, aria-describedby, tabIndex, role
   */
  const ariaData: Partial<BaseComponentProps> = {
    'aria-label': local['aria-label'] ?? 'Toast notification container',
    role: local.role ?? 'region',
  };

  /**
   * Add optional aria-describedby if provided
   * Links container to element that describes its purpose
   */
  if (local['aria-describedby']) {
    ariaData['aria-describedby'] = local['aria-describedby'];
  }

  /**
   * Add optional tabIndex if provided
   * Allows container to receive focus (useful for keyboard shortcuts)
   */
  if (typeof local.tabIndex === 'number') {
    ariaData.tabIndex = local.tabIndex;
  }

  /**
   * Create ARIA props object (normalized)
   * Utility function ensures consistent attribute format
   */
  const ariaProps = createAriaProps(ariaData);

  /**
   * Create test props for E2E/unit testing
   * Default testid: 'toast-container' if not provided
   */
  const testProps = createTestProps(local['data-testid'] ?? 'toast-container');

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div
      {...rest}
      class={containerClass()}
      data-position={local.position}
      data-max-toasts={local.maxToasts}
      // Live region: Announces changes to screen readers
      aria-live='polite'
      // Only announce new toast, not entire region
      aria-atomic='false'
      // ARIA properties (role, label, describedby, tabIndex)
      {...ariaProps}
      // Testing identifiers
      {...testProps}
      // Event handlers
      onFocus={local.onFocus}
      onBlur={local.onBlur}
      onKeyDown={local.onKeyDown}
    >
      {/* Render each toast with efficient keying */}
      <For each={limitedToasts()}>
        {toast => (
          <Toast
            toast={toast}
            onRemove={id => toastManager.remove(id)}
            data-testid={`toast-${toast.id}`}
          />
        )}
      </For>
    </div>
  );
}
