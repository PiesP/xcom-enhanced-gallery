/**
 * @fileoverview KeyboardHelpOverlay - Solid.js implementation
 * @description Provides keyboard shortcuts help overlay with focus management.
 */
import { getSolid, type JSXElement } from '../../../../shared/external/vendors';
import { useFocusTrap } from '../../../../shared/hooks/use-focus-trap';
import { globalTimerManager } from '../../../../shared/utils/timer-management';
import styles from './KeyboardHelpOverlay.module.css';
import { IconButton } from '../../../../shared/components/ui/Button/IconButton';
import { languageService } from '../../../../shared/services/language-service';

export interface KeyboardHelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardHelpOverlay({
  open,
  onClose,
}: KeyboardHelpOverlayProps): JSXElement | null {
  const { createEffect, onCleanup } = getSolid();

  let dialogElement: HTMLDivElement | null = null;
  let closeButtonElement: HTMLButtonElement | null = null;
  let previouslyFocusedElement: HTMLElement | null = null;
  let focusTimerId: number | null = null;

  const titleId = 'xeg-kho-title';
  const descId = 'xeg-kho-desc';

  useFocusTrap(
    () => dialogElement,
    () => open,
    {
      onEscape: onClose,
      restoreFocus: true,
    }
  );

  createEffect(() => {
    if (!open) {
      if (focusTimerId) {
        globalTimerManager.clearTimeout(focusTimerId);
        focusTimerId = null;
      }
      return;
    }

    if (typeof document !== 'undefined') {
      previouslyFocusedElement = document.activeElement as HTMLElement | null;
    }

    const dialog = dialogElement;
    if (!dialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);

    focusTimerId = globalTimerManager.setTimeout(() => {
      try {
        closeButtonElement?.focus();
      } catch {
        /* ignore focus errors */
      }
    }, 0);

    onCleanup(() => {
      dialog.removeEventListener('keydown', handleKeyDown);
      if (focusTimerId) {
        globalTimerManager.clearTimeout(focusTimerId);
        focusTimerId = null;
      }
    });
  });

  createEffect(() => {
    if (open) return;

    const previous = previouslyFocusedElement;
    if (!previous) return;

    globalTimerManager.setTimeout(() => {
      try {
        previous.focus();
      } catch {
        /* ignore focus errors */
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

export default KeyboardHelpOverlay;
