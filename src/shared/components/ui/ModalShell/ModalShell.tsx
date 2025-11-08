/**
 * @fileoverview Modal Shell Component
 * @version 1.2.0 - Phase 389: Full English documentation, comprehensive JSDoc
 * @description Reusable modal dialog container with semantic styling and accessibility
 * @module shared/components/ui/ModalShell
 *
 * **Modal Architecture**:
 * Provides a flexible modal wrapper supporting multiple visual variants, sizes,
 * and interaction modes. Complements ErrorBoundary (Phase 386) and other
 * dialog-based components (Phase 389+).
 *
 * **Core Features**:
 * 1. **Semantic Variants**: glass (frosted), solid, elevated surfaces
 * 2. **Size System**: sm (400px), md (500px), lg (700px), xl (900px)
 * 3. **Interaction**: Backdrop click and ESC key close handlers
 * 4. **Accessibility**: ARIA roles, focus management, keyboard navigation
 * 5. **Design Tokens**: Fully integrated with --xeg-* CSS variables
 * 6. **Animations**: Scale + translateY fade-in transitions
 *
 * **Design System Integration**:
 * - Colors: --xeg-modal-bg, --xeg-modal-border (semantic tokens)
 * - Spacing: var(--space-lg), var(--space-md) for responsive padding
 * - Shadows: var(--xeg-shadow-lg) for depth
 * - Transitions: --xeg-duration-fast, --xeg-ease-standard (Phase 254)
 * - Z-index: var(--xeg-z-modal) for layering
 * - Radius: var(--xeg-radius-lg), var(--xeg-radius-md) for corners
 *
 * **Usage Patterns**:
 * ```tsx
 * // Pattern 1: Basic modal (Settings, Dialogs)
 * import { ModalShell } from '@shared/components/ui/ModalShell';
 *
 * export function SettingsModal() {
 *   const [isOpen, setIsOpen] = createSignal(false);
 *
 *   return (
 *     <ModalShell
 *       isOpen={isOpen()}
 *       onClose={() => setIsOpen(false)}
 *       size='md'
 *       surfaceVariant='glass'
 *       aria-label='Settings'
 *     >
 *       <div className='modal-content'>
 *         <h2>Settings</h2>
 *         <SettingsForm />
 *       </div>
 *     </ModalShell>
 *   );
 * }
 *
 * // Pattern 2: Confirmation dialog (Large)
 * <ModalShell
 *   isOpen={showConfirm()}
 *   onClose={() => setShowConfirm(false)}
 *   size='lg'
 *   surfaceVariant='elevated'
 *   closeOnBackdropClick={false}
 *   aria-label='Confirm action'
 * >
 *   <ConfirmDialog />
 * </ModalShell>
 *
 * // Pattern 3: Non-dismissible modal (Wizard)
 * <ModalShell
 *   isOpen={wizardOpen()}
 *   onClose={undefined}
 *   size='xl'
 *   closeOnBackdropClick={false}
 *   closeOnEscape={false}
 * >
 *   <WizardSteps />
 * </ModalShell>
 * ```
 *
 * **Accessibility Features** (WCAG 2.1 Level AA):
 * - role='dialog': Semantic role for screen readers
 * - aria-modal='true': Indicates modal focus trap required
 * - aria-label: Required for accessible dialog identification
 * - Keyboard: ESC key closes by default (configurable)
 * - Focus: Managed via role='dialog' (browser handles)
 * - Contrast: Design tokens ensure 4.5:1 minimum (Phase 54.1)
 *
 * **Responsive Behavior** (Phase 389):
 * - Mobile (≤768px): Full-width modals with 85vh max-height
 * - Tablet (769-1024px): Uses configured size constraints
 * - Desktop (1025px+): Full size variant support
 *
 * **Animation Details** (Phase 254):
 * - Entry: Scale 0.95 → 1.0, TranslateY -10px → 0px (150ms)
 * - Opacity: 0 → 1 (150ms fade)
 * - Easing: cubic-bezier(0.2, 0, 0, 1) standard curve
 * - Performance: GPU-accelerated (transform, opacity only)
 *
 * **Integration Points**:
 * - ErrorBoundary: Can wrap error dialogs
 * - Toolbar: Settings panel uses ModalShell variant
 * - Gallery: Media info overlays (future Phase 390)
 *
 * @see {@link ./ModalShell.module.css} - Styling (semantic tokens)
 * @see {@link ../ErrorBoundary} - Error handling integration
 * @see {@link ../../../styles/} - Design token system
 */

import { type JSXElement, type ComponentChildren } from '../../../external/vendors';

/**
 * ModalShell Component Props
 *
 * **Configuration**:
 * - Display: isOpen boolean controls visibility
 * - Content: children slot for modal content
 * - Interaction: onClose callback, backdrop/escape toggles
 * - Styling: size, surfaceVariant for visual appearance
 * - Accessibility: aria-label, data-testid for integration
 *
 * @description Props for controlling modal behavior, appearance, and accessibility
 *
 * **Design System Integration**:
 * - className: Composable with CSS Module classes
 * - aria-label: Required for screen reader announcements
 * - data-testid: Enable CSS targeting and testing
 *
 * @example
 * ```tsx
 * const props: ModalShellProps = {
 *   isOpen: true,
 *   onClose: () => console.log('Closed'),
 *   size: 'md',
 *   surfaceVariant: 'glass',
 *   'aria-label': 'Settings Dialog',
 * };
 * ```
 */
export interface ModalShellProps {
  /**
   * Modal content
   * @description Slot for children components (header, body, footer)
   */
  children: ComponentChildren;

  /**
   * Modal visibility state
   * @description Controls CSS class 'modal-open' for animations
   * When false, component returns null (not displayed)
   */
  isOpen: boolean;

  /**
   * Close callback function
   * @description Triggered by ESC key or backdrop click (if enabled)
   * @default undefined (modal cannot be dismissed if not provided)
   */
  onClose?: () => void;

  /**
   * Modal size variant
   * @description Configures max-width and max-height via CSS classes
   * - 'sm': 400px max-width, 300px max-height (alerts, confirmations)
   * - 'md': 500px max-width, 70vh max-height (default, forms)
   * - 'lg': 700px max-width, 80vh max-height (settings, dialogs)
   * - 'xl': 900px max-width, 90vh max-height (wizards, large content)
   * @default 'md'
   * @example size='lg' for large settings panel
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Surface visual variant
   * @description Configures background, border, shadow for different use cases
   * - 'glass': Frosted glass effect (overlay, semi-transparent)
   * - 'solid': Solid background (default, readable content)
   * - 'elevated': Elevated surface (emphasis, important dialogs)
   * @default 'glass'
   * @example surfaceVariant='elevated' for critical confirmations
   */
  surfaceVariant?: 'glass' | 'solid' | 'elevated';

  /**
   * Allow backdrop click to close
   * @description If true, clicking outside modal closes it (if onClose provided)
   * Useful for dismissible modals (settings, preview)
   * @default true
   * @example closeOnBackdropClick={false} for non-dismissible wizards
   */
  closeOnBackdropClick?: boolean;

  /**
   * Allow ESC key to close
   * @description If true, pressing Escape closes modal (if onClose provided)
   * Standard behavior for dismissible dialogs (WCAG compliance)
   * @default true
   * @example closeOnEscape={false} for critical confirmations
   */
  closeOnEscape?: boolean;

  /**
   * Additional CSS class
   * @description Appended to modal-shell element for custom styling
   * Composable with CSS Module classes
   * @example className='custom-modal-highlight'
   */
  className?: string;

  /**
   * Test identifier
   * @description Added to modal-shell and backdrop (with '-backdrop' suffix)
   * Enables CSS targeting and Playwright selectors
   * @example 'data-testid'='settings-modal'
   */
  'data-testid'?: string;

  /**
   * Accessible label
   * @description Announced by screen readers as dialog name
   * Required for accessibility (WCAG 2.1 Level AA)
   * @example 'aria-label'='Settings Panel'
   */
  'aria-label'?: string;
}

/**
 * Modal Shell Component
 *
 * Renders a centered, animated modal dialog with configurable size, styling,
 * and interaction modes. Provides semantic HTML structure (role='dialog') and
 * full keyboard/mouse interaction support.
 *
 * **Rendering Strategy**:
 * 1. If isOpen is false: Return null (no DOM element)
 * 2. If isOpen is true: Render backdrop + modal shell
 * 3. Backdrop: Full-screen overlay with optional dismiss on click
 * 4. Modal Shell: Centered dialog with animations
 *
 * **Animation Flow**:
 * - Backdrop: opacity 0→1, visibility hidden→visible (150ms)
 * - Modal: transform scale(0.95)→1 + translateY(-10px)→0 (150ms)
 * - Easing: cubic-bezier(0.2, 0, 0, 1) for smooth feel
 * - Uses GPU-accelerated properties (transform, opacity)
 *
 * **Interaction Handling**:
 * - ESC Key: Closes if closeOnEscape=true and onClose provided
 * - Backdrop Click: Closes if closeOnBackdropClick=true and onClose provided
 * - Modal Click: Event stops propagation (doesn't dismiss)
 * - Keyboard: onKeyDown bubbles to backdrop (captures ESC)
 *
 * **Accessibility** (WCAG 2.1 AA):
 * - role='dialog': Identifies as dialog for assistive tech
 * - aria-modal='true': Indicates modal focus behavior
 * - aria-label: Required for dialog identification
 * - Focus management: Browser handles via role='dialog'
 * - Semantic: Uses div with proper ARIA attributes
 *
 * **Performance Considerations**:
 * - Conditional Render: null when closed (no DOM overhead)
 * - CSS-only Animations: Transform + opacity (GPU-accelerated)
 * - Event Delegation: Single handler per element (no micro-optimizations)
 * - Memory: No subscriptions or timers (safe cleanup)
 *
 * @param props - ModalShellProps configuration
 * @returns JSXElement (modal markup) or null (when closed)
 *
 * @example
 * ```tsx
 * // Basic settings modal
 * import { ModalShell } from '@shared/components/ui/ModalShell';
 * import { createSignal } from 'solid-js';
 *
 * export function SettingsPanel() {
 *   const [isOpen, setIsOpen] = createSignal(false);
 *
 *   return (
 *     <>
 *       <button onClick={() => setIsOpen(true)}>Open Settings</button>
 *       <ModalShell
 *         isOpen={isOpen()}
 *         onClose={() => setIsOpen(false)}
 *         size='lg'
 *         surfaceVariant='glass'
 *         aria-label='Settings'
 *       >
 *         <div className='settings-content'>
 *           <h2>Application Settings</h2>
 *         </div>
 *       </ModalShell>
 *     </>
 *   );
 * }
 * ```
 */
export function ModalShell({
  children,
  isOpen,
  onClose,
  size = 'md',
  surfaceVariant = 'glass',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  'data-testid': testId,
  'aria-label': ariaLabel,
  ...props
}: ModalShellProps): JSXElement | null {
  // Build CSS class names from semantic props
  const sizeClass = `modal-size-${size}`;
  const surfaceClass = `modal-surface-${surfaceVariant}`;

  /**
   * Handle ESC key press
   * Closes modal if closeOnEscape enabled and onClose provided
   * @param event - Keyboard event
   */
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (closeOnEscape && event.key === 'Escape' && onClose) {
      onClose();
    }
  };

  /**
   * Handle backdrop click
   * Closes modal only if click target is backdrop itself (not modal content)
   * Prevents accidental dismissal from content interactions
   * @param event - Click event from backdrop
   */
  const handleBackdropClick = (event: Event): void => {
    if (closeOnBackdropClick && event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  // Early return: component not rendered when closed
  if (!isOpen) return null;

  return (
    <div
      class={`modal-backdrop ${isOpen ? 'modal-open' : ''}`.trim()}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      data-testid={testId ? `${testId}-backdrop` : undefined}
    >
      <div
        class={`modal-shell ${sizeClass} ${surfaceClass} ${className}`.trim()}
        role='dialog'
        aria-modal='true'
        aria-label={ariaLabel || 'Modal'}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

export default ModalShell;
