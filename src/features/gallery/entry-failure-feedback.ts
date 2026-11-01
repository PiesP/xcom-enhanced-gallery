// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { getThemeService } from '@shared/services/theme-service';

import './styles/entry-failure-feedback.css';

interface EntryFailureOptions {
  readonly element: HTMLElement;
  readonly message: string;
  readonly nextAction: string;
  readonly dismissLabel: string;
  readonly isCurrent: () => boolean;
}

/** A dismissible terminal message owned by one failed source interaction. */
export function showEntryFailure(options: EntryFailureOptions): () => void {
  if (!options.isCurrent() || !options.element.isConnected) {
    return () => undefined;
  }
  const notice = document.createElement('div');
  notice.className = 'xeg-theme-scope pp-design xeg-entry-failure';
  notice.dataset.ppProduct = 'xeg';
  notice.dataset.xegEntryFailure = '';
  notice.dataset.theme = getThemeService().getEffectiveTheme();
  const message = document.createElement('p');
  message.setAttribute('role', 'status');
  message.textContent = options.message;
  const nextAction = document.createElement('p');
  nextAction.textContent = options.nextAction;
  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.textContent = options.dismissLabel;
  notice.append(message, nextAction, dismiss);
  let timer: ReturnType<typeof setInterval> | null = null;
  let disposed = false;
  const dispose = (): void => {
    if (disposed) {
      return;
    }
    disposed = true;
    if (timer !== null) {
      clearInterval(timer);
    }
    window.removeEventListener('scroll', place, true);
    window.removeEventListener('resize', place);
    window.removeEventListener('pagehide', dispose);
    notice.remove();
  };
  const place = (): void => {
    if (!options.isCurrent() || !options.element.isConnected) {
      dispose();
      return;
    }
    const rect = options.element.getBoundingClientRect();
    notice.hidden = rect.bottom <= 0 || rect.top >= window.innerHeight;
    notice.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - notice.offsetWidth - 8))}px`;
    const below = rect.bottom + 8;
    notice.style.top = `${
      below + notice.offsetHeight <= window.innerHeight
        ? below
        : Math.max(8, rect.top - notice.offsetHeight - 8)
    }px`;
  };
  dismiss.addEventListener('click', () => {
    // Removing a focused dismissal must not strand keyboard focus on the body.
    if (
      notice.contains(document.activeElement) &&
      options.isCurrent() &&
      options.element.isConnected
    ) {
      const target =
        options.element.closest<HTMLElement>('button:not(:disabled), a[href], [tabindex]') ??
        options.element;
      const priorTabIndex = target.getAttribute('tabindex');
      if (priorTabIndex === null && target.tabIndex < 0) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
      target.focus({ preventScroll: true });
    }
    dispose();
  });
  document.body.append(notice);
  place();
  window.addEventListener('scroll', place, true);
  window.addEventListener('resize', place);
  window.addEventListener('pagehide', dispose, { once: true });
  timer = setInterval(place, 250);
  return dispose;
}
