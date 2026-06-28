// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview CSS animation helpers for gallery entrance/exit effects.
 */

import { ANIMATION_TIMEOUT_MS } from '@constants/performance';

const ANIMATION_CLASSES = {
  FADE_IN: 'xeg-fade-in',
  FADE_OUT: 'xeg-fade-out',
} as const;

function runCssAnimation(element: Element, className: string): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let observer: MutationObserver | undefined;

    const settle = (): void => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (observer) observer.disconnect();
      element.classList.remove(className);
      element.removeEventListener('animationend', settle);
      element.removeEventListener('animationcancel', settle);
      resolve();
    };

    timer = setTimeout(settle, ANIMATION_TIMEOUT_MS);

    element.addEventListener('animationend', settle, { once: true });
    element.addEventListener('animationcancel', settle, { once: true });

    // W3: MutationObserver fallback — if the element is removed from DOM
    // before animationend fires, settle immediately to avoid hanging promise
    if (element.isConnected && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        if (!element.isConnected) {
          settle();
        }
      });
      // Observe the parent for childList changes (element removal)
      if (element.parentElement) {
        observer.observe(element.parentElement, { childList: true, subtree: false });
      }
    }

    if (!element.isConnected) {
      settle();
      return;
    }

    try {
      element.classList.add(className);
    } catch {
      settle();
    }
  });
}

export function animateGalleryEnter(element: Element): Promise<void> {
  return runCssAnimation(element, ANIMATION_CLASSES.FADE_IN);
}

export function animateGalleryExit(element: Element): Promise<void> {
  return runCssAnimation(element, ANIMATION_CLASSES.FADE_OUT);
}
