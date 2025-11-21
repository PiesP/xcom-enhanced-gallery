/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Keyboard Help Overlay Component
 * @description Accessible modal dialog displaying keyboard shortcuts with focus management
 * @module features/gallery/components/vertical-gallery-view/KeyboardHelpOverlay
 *
 * **Responsibilities**:
 * - Display keyboard shortcut information in a modal overlay
 * - Manage focus trapping (Escape key, focus restoration)
 * - Provide full keyboard and screen reader accessibility
 * - Support internationalization via language service
 * - Respect motion preferences
 *
 * **Features**:
 * - Focus trapping: Focus stays within dialog while open
 * - Focus restoration: Returns focus to previously focused element when closed
 * - Keyboard support: Escape key and close button close the dialog
 * - Accessibility: Complete ARIA attributes (role, labelledby, describedby, modal)
 * - Internationalization: Localized strings via languageService
 *
 * **API**:
 * - Props: {@link KeyboardHelpOverlayProps}
 * - Returns JSXElement | null (conditionally rendered)
 *
 * @version 1.2.0 - Enhanced documentation and export clarity (Phase 354+)
 */

import type { JSXElement } from 'solid-js';
import { getSolid } from '@shared/external/vendors';
import { useFocusTrap } from '@shared/hooks';
import { globalTimerManager } from '@shared/utils/timer-management';
import { IconButton } from '@shared/components/ui/Button/IconButton';
import { languageService } from '@shared/services/language-service';
import styles from './KeyboardHelpOverlay.module.css';

/**
 * Props for KeyboardHelpOverlay component
 * @interface KeyboardHelpOverlayProps
 */
export interface KeyboardHelpOverlayProps {
  /**
   * Whether the overlay is displayed
   */
  open: boolean;

  /**
   * Callback invoked when user closes the overlay (Escape key or close button)
   */
  onClose: () => void;
}

/**
 * Keyboard Help Overlay Component
 *
 * **Fully accessible modal dialog** displaying keyboard shortcuts and navigation help.
 *
 * **Features**:
 * - Focus trapping: Focus stays within dialog while open
 * - Focus restoration: Returns focus to previously focused element when closed
 * - Keyboard support: Escape key and close button close the dialog
 * - Accessibility: Complete ARIA attributes (role, labelledby, describedby, modal)
 * - Internationalization: Uses languageService for localized strings
 * - Motion preferences: Respects prefers-reduced-motion (via CSS tokens)
 *
 * **Rendering**:
 * - Returns null if open is false (not mounted)
 * - Rendered as fixed modal overlay when open is true
 *
 * **Focus Management**:
 * 1. When opening: Saves current focus, transfers focus to close button
 * 2. When closing: Restores focus to previously focused element
 * 3. While open: Escape key closes dialog (via useFocusTrap)
 *
 * **Usage**:
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
 *
 * @param props - Component props
 * @param props.open - Controls visibility of the overlay
 * @param props.onClose - Callback when user closes the overlay
 * @returns JSX element (modal) or null if not open
 *
 * @example
 * // In VerticalGalleryView component:
 * useGalleryKeyboard({
 *   onClose: () => setGalleryVisible(false),
 *   onOpenHelp: () => setIsHelpOpen(true),
 * });
 */
export function KeyboardHelpOverlay({
  open,
  onClose,
}: KeyboardHelpOverlayProps): JSXElement | null {
  const { createEffect, onCleanup, createSignal, createMemo, onMount } = getSolid();

  const [languageRevision, setLanguageRevision] = createSignal(0);

  onMount(() => {
    const unsubscribe = languageService.onLanguageChange(() =>
      setLanguageRevision(revision => revision + 1)
    );
    onCleanup(unsubscribe);
  });

  const localizedStrings = createMemo(() => {
    languageRevision();
    return {
      closeLabel: languageService.translate('toolbar.close'),
      title: languageService.translate('messages.keyboardHelp.title'),
      shortcuts: {
        navPrevious: languageService.translate('messages.keyboardHelp.navPrevious'),
        navNext: languageService.translate('messages.keyboardHelp.navNext'),
        close: languageService.translate('messages.keyboardHelp.close'),
        toggleHelp: languageService.translate('messages.keyboardHelp.toggleHelp'),
      },
    } as const;
  });

  // Dialog and button element references
  let dialogElement: HTMLDivElement | null = null;
  let closeButtonElement: HTMLButtonElement | null = null;

  // Track previously focused element for restoration on close
  let previouslyFocusedElement: HTMLElement | null = null;
  let focusTimerId: number | null = null;

  // Accessibility IDs for ARIA labeling and description
  const titleId = 'xeg-kho-title';
  const descId = 'xeg-kho-desc';

  // Setup focus trapping (Escape key support via useFocusTrap)
  useFocusTrap(
    () => dialogElement,
    () => open,
    {
      onEscape: onClose,
      restoreFocus: true,
    }
  );

  // Phase 1: Handle dialog opening - save and transfer focus
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
    if (!dialog) {
      return;
    }

    // Focus close button after dialog renders
    // Using setTimeout(0) ensures DOM is ready before focus attempt
    focusTimerId = globalTimerManager.setTimeout(() => {
      try {
        closeButtonElement?.focus();
      } catch {
        // Ignore focus errors in edge cases (element not ready, removed, etc.)
      }
    }, 0);

    onCleanup(() => {
      if (focusTimerId) {
        globalTimerManager.clearTimeout(focusTimerId);
        focusTimerId = null;
      }
    });
  });

  // Phase 2: Handle dialog closing - restore focus to previously focused element
  createEffect(() => {
    if (open) {
      return;
    }

    const previous = previouslyFocusedElement;
    if (!previous) {
      return;
    }

    // Restore focus asynchronously to allow cleanup
    globalTimerManager.setTimeout(() => {
      try {
        previous.focus();
      } catch {
        // Ignore focus errors in edge cases (element no longer in DOM, etc.)
      }
    }, 0);
    previouslyFocusedElement = null;
  });

  if (!open) {
    return null;
  }

  // Modal overlay structure: backdrop + dialog
  // Backdrop: Semi-transparent overlay covering viewport, closes on click outside
  // Dialog: Centered modal with close button and content
  return (
    <div
      class={styles.backdrop}
      role='presentation'
      onClick={event => {
        // Close dialog when clicking outside (on backdrop)
        // event.target === event.currentTarget ensures click is on backdrop, not dialog
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Dialog container with accessibility attributes */}
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
        {/* Close button in top-right corner */}
        <IconButton
          ref={element => {
            closeButtonElement = element;
          }}
          className={styles.closeButton || ''}
          size='md'
          tabIndex={0}
          aria-label={localizedStrings().closeLabel}
          data-testid='kho-close-button'
          onClick={onClose}
        />

        {/* Title */}
        <h2 id={titleId} class={styles.title}>
          {localizedStrings().title}
        </h2>

        {/* Content: Description and keyboard shortcuts list */}
        <div id={descId} class={styles.content}>
          <ul class={styles.shortcutList}>
            <li>{localizedStrings().shortcuts.navPrevious}</li>
            <li>{localizedStrings().shortcuts.navNext}</li>
            <li>{localizedStrings().shortcuts.close}</li>
            <li>{localizedStrings().shortcuts.toggleHelp}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
