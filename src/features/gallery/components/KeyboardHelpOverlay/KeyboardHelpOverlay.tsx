/**
 * KeyboardHelpOverlay - Solid.js version
 */
import { type JSX, createSignal, createEffect, onCleanup, Show } from 'solid-js';
import { getSolid } from '@shared/external/vendors';
import { globalTimerManager } from '@shared/utils/timer-management';
import { createFocusTrap } from '@shared/primitives/focusTrap-solid';
import styles from './KeyboardHelpOverlay.module.css';
import { IconButton } from '@shared/components/ui/Button/IconButton';
import { languageService } from '@shared/services/LanguageService';

const { createMemo } = getSolid();

export interface KeyboardHelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardHelpOverlay(props: KeyboardHelpOverlayProps): JSX.Element {
  const [dialogRef, setDialogRef] = createSignal<HTMLElement | null>(null);
  const titleId = createMemo(() => 'xeg-kho-title');
  const descId = createMemo(() => 'xeg-kho-desc');

  let prevFocusEl: HTMLElement | null = null;
  let prevFocusSelector: string | null = null;
  const timeouts: number[] = [];
  let interval: number | null = null;

  createEffect(() => {
    if (props.open) {
      const ae = document.activeElement as HTMLElement | null;
      if (ae && ae.tagName !== 'BODY') {
        prevFocusEl = ae;
        const id = ae.getAttribute('id');
        const aria = ae.getAttribute('aria-label');
        prevFocusSelector = id ? `#${id}` : aria ? `[aria-label="${aria}"]` : null;
      } else {
        prevFocusEl = null;
        prevFocusSelector = null;
      }
    }
  });

  const resolvePrevTarget = (): HTMLElement | null => {
    if (typeof document === 'undefined') return null;
    let el = prevFocusEl;
    if (!el?.isConnected) {
      if (prevFocusSelector) {
        const q = document.querySelector(prevFocusSelector) as HTMLElement | null;
        if (q) el = q;
      }
      if (!el?.isConnected) {
        const fallback = document.querySelector('button[aria-label]') as HTMLElement | null;
        if (fallback) el = fallback;
      }
    }
    return el?.isConnected ? el : null;
  };

  const focusPrevNow = () => {
    if (typeof document === 'undefined') return;
    const target = resolvePrevTarget();
    if (!target) return;
    try {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      const cur = document.activeElement as HTMLElement | null;
      if (cur && cur !== document.body) cur.blur?.();
      target.focus?.();
      target.setAttribute('data-xeg-focused', '1');
    } catch {
      /* ignore */
    }
  };

  const handleEscape = () => {
    focusPrevNow();
    [0, 10, 20, 50, 100, 250, 500].forEach(ms => {
      const id = globalTimerManager.setTimeout(() => focusPrevNow(), ms) as unknown as number;
      timeouts.push(id);
    });
    try {
      const start = Date.now();
      const iv = globalTimerManager.setInterval(() => {
        if (typeof document === 'undefined') return;
        try {
          focusPrevNow();
        } catch {
          /* ignore */
        }
        if (Date.now() - start > 950) {
          try {
            globalTimerManager.clearInterval(iv);
          } catch {
            /* ignore */
          }
        }
      }, 20);
      interval = iv as unknown as number;
    } catch {
      /* ignore */
    }
    props.onClose();
  };

  createFocusTrap(dialogRef, () => props.open, {
    onEscape: handleEscape,
    initialFocus: '[data-testid="kho-close-button"]',
    restoreFocus: true,
    previousFocusElement: prevFocusEl,
    previousFocusSelector: prevFocusSelector,
  });

  createEffect(() => {
    if (!props.open) {
      const attempts = [0, 10, 20, 50, 100, 250, 500, 800, 900, 1200];
      attempts.forEach(ms => {
        const id = globalTimerManager.setTimeout(() => {
          if (typeof document === 'undefined') return;
          const target = resolvePrevTarget();
          if (!target) return;
          try {
            if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
            target.focus?.();
            target.setAttribute('data-xeg-focused', '1');
          } catch {
            /* ignore */
          }
        }, ms) as unknown as number;
        timeouts.push(id);
      });
    }
  });

  onCleanup(() => {
    while (timeouts.length) {
      const id = timeouts.pop();
      if (id !== undefined) {
        try {
          globalTimerManager.clearTimeout(id);
        } catch {
          /* ignore */
        }
      }
    }
    if (interval !== null) {
      try {
        globalTimerManager.clearInterval(interval);
      } catch {
        /* ignore */
      }
      interval = null;
    }
  });

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) props.onClose();
  };

  return (
    <Show when={props.open}>
      <div class={styles.backdrop} role='presentation' onClick={handleBackdropClick}>
        <div
          ref={setDialogRef}
          class={styles.dialog}
          role='dialog'
          aria-modal='true'
          aria-labelledby={titleId()}
          aria-describedby={descId()}
        >
          <IconButton
            className={styles.closeButton || ''}
            size='md'
            tabIndex={0}
            onClick={props.onClose}
            aria-label={languageService.getString('toolbar.close')}
            data-testid='kho-close-button'
          >
            <span>×</span>
          </IconButton>
          <h2 id={titleId()} class={styles.title}>
            {languageService.getString('messages.keyboardHelp.title')}
          </h2>
          <div id={descId()} class={styles.content}>
            <ul class={styles.shortcutList}>
              <li>{languageService.getString('messages.keyboardHelp.navPrevious')}</li>
              <li>{languageService.getString('messages.keyboardHelp.navNext')}</li>
              <li>{languageService.getString('messages.keyboardHelp.close')}</li>
              <li>{languageService.getString('messages.keyboardHelp.toggleHelp')}</li>
            </ul>
          </div>
        </div>
      </div>
    </Show>
  );
}

export default KeyboardHelpOverlay;
