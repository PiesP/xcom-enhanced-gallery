import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';
import styles from './KeyboardHelpOverlay.module.css';
import { IconButton } from '@shared/components/ui';

export interface KeyboardHelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

let overlayIdCounter = 0;

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

export const KeyboardHelpOverlay = (props: KeyboardHelpOverlayProps) => {
  const { createEffect, createMemo, onCleanup } = getSolidCore();

  const instanceId = ++overlayIdCounter;
  const titleId = `xeg-kho-title-${instanceId}`;
  const descId = `xeg-kho-desc-${instanceId}`;

  let dialogRef: HTMLDivElement | undefined;
  let closeButtonRef: HTMLButtonElement | undefined;
  let previousFocus: HTMLElement | null = null;
  let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  const resolveFocusableElements = (): HTMLElement[] => {
    if (!dialogRef) {
      return [];
    }
    const elements = dialogRef.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    return Array.from(elements).filter(element => !element.hasAttribute('disabled'));
  };

  const focusElement = (element: HTMLElement | null | undefined) => {
    if (!element) return;
    try {
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1');
      }
      element.focus({ preventScroll: true });
      element.setAttribute('data-xeg-focused', '1');
    } catch (error) {
      logger.debug('[KeyboardHelpOverlay] focus attempt failed', error);
    }
  };

  const restoreFocus = () => {
    if (!previousFocus) {
      return;
    }
    focusElement(previousFocus);
    previousFocus = null;
  };

  const trapFocus = (event: KeyboardEvent) => {
    const focusable = resolveFocusableElements();
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (active === first || !dialogRef?.contains(active)) {
        event.preventDefault();
        focusElement(last);
      }
    } else if (active === last || !dialogRef?.contains(active)) {
      event.preventDefault();
      focusElement(first);
    }
  };

  const attachKeydownHandler = () => {
    if (keydownHandler) {
      return;
    }

    keydownHandler = (event: KeyboardEvent) => {
      if (!props.open) {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        restoreFocus();
        props.onClose();
        return;
      }
      if (event.key === 'Tab') {
        trapFocus(event);
      }
    };

    document.addEventListener('keydown', keydownHandler, true);
  };

  const detachKeydownHandler = () => {
    if (!keydownHandler) {
      return;
    }
    document.removeEventListener('keydown', keydownHandler, true);
    keydownHandler = null;
  };

  const scheduleMicrotask = (callback: () => void) => {
    const queue = (globalThis as { queueMicrotask?: (cb: () => void) => void }).queueMicrotask;
    if (typeof queue === 'function') {
      queue(callback);
      return;
    }
    Promise.resolve()
      .then(callback)
      .catch(error => {
        logger.debug('[KeyboardHelpOverlay] microtask scheduling failed', error);
      });
  };

  const isOpenMemo = createMemo(() => props.open);

  createEffect(() => {
    if (!isOpenMemo()) {
      detachKeydownHandler();
      restoreFocus();
      return;
    }

    if (typeof document !== 'undefined') {
      const active = document.activeElement as HTMLElement | null;
      if (active && active !== document.body) {
        previousFocus = active;
      } else {
        previousFocus = null;
      }
    }

    attachKeydownHandler();

    scheduleMicrotask(() => {
      focusElement(closeButtonRef ?? resolveFocusableElements()[0] ?? null);
    });

    return () => {
      detachKeydownHandler();
    };
  });

  onCleanup(() => {
    detachKeydownHandler();
    previousFocus = null;
  });

  const handleBackdropClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = (
    event: MouseEvent
  ) => {
    if (event.currentTarget === event.target) {
      restoreFocus();
      props.onClose();
    }
  };

  return (
    <>
      {isOpenMemo() && (
        <div class={styles.backdrop} role='presentation' onClick={handleBackdropClick}>
          <div
            ref={(node: HTMLDivElement | null) => {
              dialogRef = node ?? undefined;
            }}
            class={styles.dialog}
            role='dialog'
            aria-modal='true'
            aria-labelledby={titleId}
            aria-describedby={descId}
            data-xeg-open='true'
          >
            <IconButton
              ref={(node: HTMLButtonElement | null) => {
                closeButtonRef = node ?? undefined;
              }}
              className={styles.closeButton ?? undefined}
              size='md'
              tabIndex={0}
              aria-label='Close'
              onClick={() => {
                restoreFocus();
                props.onClose();
              }}
            />
            <h2 id={titleId} class={styles.title}>
              Keyboard shortcuts
            </h2>
            <div id={descId} class={styles.content}>
              <ul class={styles.shortcutList}>
                <li>
                  <strong>←</strong> (ArrowLeft): Previous media
                </li>
                <li>
                  <strong>→</strong> (ArrowRight): Next media
                </li>
                <li>
                  <strong>Home</strong>: First media
                </li>
                <li>
                  <strong>End</strong>: Last media
                </li>
                <li>
                  <strong>Space</strong>: Toggle play/pause (video)
                </li>
                <li>
                  <strong>Esc</strong> (Escape): Close gallery
                </li>
                <li>
                  <strong>?</strong>: Show this help
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardHelpOverlay;
