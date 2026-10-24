// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { getThemeService } from '@shared/services/theme-service';

import './styles/opening-feedback.css';

/** Fast fixture openings finish within 300 ms; wait before acknowledging a held request. */
export const OPENING_FEEDBACK_DELAY_MS = 500;

interface OpeningFeedbackOptions {
  readonly element: HTMLElement;
  readonly signal: AbortSignal;
  readonly isCurrent: () => boolean;
  readonly text: string;
}

/** Owns the source-adjacent status for exactly one extraction attempt. */
export function startOpeningFeedback({
  element,
  signal,
  isCurrent,
  text,
}: OpeningFeedbackOptions): () => void {
  let status: HTMLDivElement | null = null;
  let positionTimer: ReturnType<typeof setInterval> | null = null;

  const place = (): void => {
    if (!status) {
      return;
    }
    if (!isCurrent() || !element.isConnected) {
      dispose();
      return;
    }
    const rect = element.getBoundingClientRect();
    status.hidden = rect.bottom <= 0 || rect.top >= window.innerHeight;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - status.offsetWidth - 8));
    const below = rect.bottom + 8;
    const top =
      below + status.offsetHeight <= window.innerHeight
        ? below
        : Math.max(8, rect.top - status.offsetHeight - 8);
    status.style.left = `${left}px`;
    status.style.top = `${top}px`;
  };

  const dispose = (): void => {
    clearTimeout(showTimer);
    if (positionTimer !== null) {
      clearInterval(positionTimer);
      positionTimer = null;
    }
    window.removeEventListener('scroll', place, true);
    window.removeEventListener('resize', place);
    signal.removeEventListener('abort', dispose);
    status?.remove();
    status = null;
  };

  const showTimer = setTimeout(() => {
    if (signal.aborted || !isCurrent() || !element.isConnected) {
      return;
    }
    status = document.createElement('div');
    status.className = 'xeg-theme-scope pp-design xeg-opening-feedback';
    status.dataset.ppProduct = 'xeg';
    status.dataset.xegOpening = '';
    status.dataset.theme = getThemeService().getEffectiveTheme();
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = text;
    document.body.append(status);
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    positionTimer = setInterval(place, 250);
  }, OPENING_FEEDBACK_DELAY_MS);

  signal.addEventListener('abort', dispose, { once: true });
  if (signal.aborted) {
    dispose();
  }
  return dispose;
}
