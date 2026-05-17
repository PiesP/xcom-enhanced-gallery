/**
 * @fileoverview CSS animation helpers for gallery entrance/exit effects.
 */

const ANIMATION_CLASSES = {
  FADE_IN: 'xeg-fade-in',
  FADE_OUT: 'xeg-fade-out',
} as const;

const ANIMATION_TIMEOUT_MS = 5000;

function runCssAnimation(element: Element, className: string): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    const settle = (): void => {
      if (settled) return;
      settled = true;
      element.classList.remove(className);
      resolve();
    };

    element.addEventListener('animationend', settle, { once: true });
    element.addEventListener('animationcancel', settle, { once: true });

    setTimeout(settle, ANIMATION_TIMEOUT_MS);

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
