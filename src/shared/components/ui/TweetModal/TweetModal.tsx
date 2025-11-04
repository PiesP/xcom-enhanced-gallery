/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Tweet Text Modal Component (Solid.js)
 * @description Modal dialog for displaying full tweet text
 *
 * **Responsibilities**:
 * - Display tweet text in accessible modal
 * - Support keyboard navigation (Escape to close)
 * - Focus trapping and restoration
 * - Glassmorphism design consistent with app
 * - Handle long text with scrolling
 *
 * **Features**:
 * - Full accessibility (ARIA, WCAG 2.1 AA)
 * - Focus management
 * - Motion preferences support
 * - Internationalization ready
 *
 * @module shared/components/ui/TweetModal
 */

import { getSolid, type JSXElement } from '@shared/external/vendors';
import { useFocusTrap } from '@shared/hooks/use-focus-trap';
import { globalTimerManager } from '@shared/utils/timer-management';
import { IconButton } from '@shared/components/ui/Button/IconButton';
import { languageService } from '@shared/services/language-service';
import styles from './TweetModal.module.css';

export interface TweetModalProps {
  /** Whether the modal is displayed */
  open: boolean;
  /** Tweet text content */
  text?: string | undefined;
  /** Callback when user closes the modal */
  onClose: () => void;
}

/**
 * Tweet Text Modal Component
 *
 * Displays full tweet text in an accessible modal dialog.
 * Follows the same pattern as KeyboardHelpOverlay for consistency.
 */
export function TweetModal({ open, text, onClose }: TweetModalProps): JSXElement | null {
  const { createEffect } = getSolid();

  let dialogElement: HTMLDivElement | null = null;
  let closeButtonElement: HTMLButtonElement | null = null;
  let focusTimerId: number | null = null;

  const titleId = 'xeg-tweet-modal-title';
  const contentId = 'xeg-tweet-modal-content';

  // Setup focus trapping
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
      if (focusTimerId) {
        globalTimerManager.clearTimeout(focusTimerId);
        focusTimerId = null;
      }
      return;
    }

    const dialog = dialogElement;
    if (!dialog) return;

    focusTimerId = globalTimerManager.setTimeout(() => {
      const closeBtn = closeButtonElement;
      if (closeBtn && typeof closeBtn.focus === 'function') {
        closeBtn.focus();
      }
    }, 150);
  });

  if (!open) {
    return null;
  }

  return (
    <div
      ref={el => (dialogElement = el)}
      class={styles.overlay}
      role='dialog'
      aria-modal='true'
      aria-labelledby={titleId}
      aria-describedby={contentId}
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div class={styles.modal}>
        <div class={styles.header}>
          <h2 id={titleId} class={styles.title}>
            {languageService.getString('gallery.tweetText') ?? 'Tweet Text'}
          </h2>
          <IconButton
            ref={el => (closeButtonElement = el)}
            onClick={onClose}
            size='md'
            aria-label={languageService.getString('toolbar.close') ?? 'Close'}
            {...(styles.closeButton && { className: styles.closeButton })}
          >
            ✕
          </IconButton>
        </div>

        <div id={contentId} class={styles.content}>
          {text || (
            <p class={styles.noText}>
              {languageService.getString('gallery.noTweetText') ?? 'No tweet text available'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
