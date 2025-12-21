/**
 * @fileoverview CSS-based animation helpers
 *
 * @description
 * Lightweight helpers that rely on already-injected global CSS.
 * Keep this module small to minimize production bundle size.
 */

import { logger } from '@shared/logging';

// CSS class constants (internal)
const ANIMATION_CLASSES = {
  FADE_IN: 'xeg-fade-in',
  FADE_OUT: 'xeg-fade-out',
} as const;

const safeLogAnimationFailure = (message: string, error: unknown): void => {
  if (__DEV__) {
    logger.warn(message, error);
  }
};

function runCssAnimation(element: Element, className: string): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const handleAnimationEnd = () => {
        element.classList.remove(className);
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd, { once: true });
      element.classList.add(className);
    } catch (error) {
      safeLogAnimationFailure('CSS animation failed', error);
      resolve();
    }
  });
}

/**
 * Gallery container entry animation (CSS-based)
 */
export async function animateGalleryEnter(element: Element): Promise<void> {
  return runCssAnimation(element, ANIMATION_CLASSES.FADE_IN);
}

/**
 * Gallery container exit animation (CSS-based)
 */
export async function animateGalleryExit(element: Element): Promise<void> {
  return runCssAnimation(element, ANIMATION_CLASSES.FADE_OUT);
}
