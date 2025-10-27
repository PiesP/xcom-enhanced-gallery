/**
 * @fileoverview Keyboard Help Overlay Component
 * @description Modal dialog displaying keyboard shortcuts with full accessibility and focus management.
 * @module features/gallery/components/KeyboardHelpOverlay
 */

import { getSolid, type JSXElement } from '@shared/external/vendors';
import { useFocusTrap } from '@shared/hooks/use-focus-trap';
import { globalTimerManager } from '@shared/utils/timer-management';
import { IconButton } from '@shared/components/ui/Button/IconButton';
import { languageService } from '@shared/services/language-service';
import styles from './KeyboardHelpOverlay.module.css';

/**
 * Props for KeyboardHelpOverlay component
 */
export interface KeyboardHelpOverlayProps {
  /** Whether the overlay is displayed */
  open: boolean;
  /** Callback invoked when user closes the overlay (Escape key or close button) */
  onClose: () => void;
}

/**
 * Keyboard Help Overlay Component
 *
 * A fully accessible modal dialog that displays keyboard shortcuts and navigation help.
 * Features:
 * - Focus trapping: Focus stays within the dialog while open
 * - Focus restoration: Returns focus to previously focused element when closed
 * - Keyboard support: Escape key and close button close the dialog
 * - Accessibility: Complete ARIA attributes (role, labelledby, describedby, modal)
 * - Internationalization: Uses languageService for localized strings
 * - Motion preferences: Respects prefers-reduced-motion
 *
 * @param props - Component props
 * @param props.open - Controls visibility of the overlay
 * @param props.onClose - Callback when user closes the overlay
 * @returns JSX element or null if not open
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = createSignal(false);
 *
 * return (
 *   <>
 *     <button onClick={() => setIsOpen(true)}>Show Help</button>
 *     <KeyboardHelpOverlay open={isOpen()} onClose={() => setIsOpen(false)} />
 *   </>
 * );
 * ```
 */
export function KeyboardHelpOverlay({
  open,
  onClose,
}: KeyboardHelpOverlayProps): JSXElement | null {
  const { createEffect, onCleanup } = getSolid();

  // Dialog and button element references
  let dialogElement: HTMLDivElement | null = null;
  let closeButtonElement: HTMLButtonElement | null = null;

  // Track previously focused element for restoration
  let previouslyFocusedElement: HTMLElement | null = null;
  let focusTimerId: number | null = null;

  // Accessibility IDs
  const titleId = 'xeg-kho-title';
  const descId = 'xeg-kho-desc';

  // Setup focus trapping (Escape key support)
  useFocusTrap(
    () => dialogElement,
    () => open,
    {
      onEscape: onClose,
      restoreFocus: true,
    }
  );

  // Handle dialog opening: save focus and transfer to close button
  createEffect(() => {
    if (!open) {
      // Clean up timer on close
      if (focusTimerId) {
        globalTimerManager.clearTimeout(focusTimerId);
        focusTimerId = null;
      }
      return;
    }

    // Save currently focused element to restore later
    if (typeof document !== 'undefined') {
      previouslyFocusedElement = document.activeElement as HTMLElement | null;
    }

    const dialog = dialogElement;
    if (!dialog) return;

    // Focus close button after dialog renders (async to ensure DOM is ready)
    focusTimerId = globalTimerManager.setTimeout(() => {
      try {
        closeButtonElement?.focus();
      } catch {
        // Ignore focus errors in edge cases
      }
    }, 0);

    onCleanup(() => {
      if (focusTimerId) {
        globalTimerManager.clearTimeout(focusTimerId);
        focusTimerId = null;
      }
    });
  });

  // Handle dialog closing: restore focus to previously focused element
  createEffect(() => {
    if (open) return;

    const previous = previouslyFocusedElement;
    if (!previous) return;

    // Restore focus asynchronously
    globalTimerManager.setTimeout(() => {
      try {
        previous.focus();
      } catch {
        // Ignore focus errors in edge cases
      }
    }, 0);
    previouslyFocusedElement = null;
  });

  if (!open) {
    return null;
  }

  return (
    <div
      class={styles.backdrop}
      role='presentation'
      onClick={event => {
        // Close when clicking outside the dialog (on backdrop)
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={element => {
          dialogElement = element;
        }}
        class={styles.dialog}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <IconButton
          ref={element => {
            closeButtonElement = element;
          }}
          className={styles.closeButton || ''}
          size='md'
          tabIndex={0}
          aria-label={languageService.getString('toolbar.close')}
          data-testid='kho-close-button'
          onClick={onClose}
        />
        <h2 id={titleId} class={styles.title}>
          {languageService.getString('messages.keyboardHelp.title')}
        </h2>
        <div id={descId} class={styles.content}>
          <ul class={styles.shortcutList}>
            <li>{languageService.getString('messages.keyboardHelp.navPrevious')}</li>
            <li>{languageService.getString('messages.keyboardHelp.navNext')}</li>
            <li>{languageService.getString('messages.keyboardHelp.close')}</li>
            <li>{languageService.getString('messages.keyboardHelp.toggleHelp')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
