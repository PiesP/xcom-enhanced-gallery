/**
 * @fileoverview CSS-based animation helpers
 *
 * Lightweight helpers that rely on already-injected global CSS.
 * Keep this module small to minimize production bundle size.
 */

import { logger } from '@shared/logging/logger';

/**
 * CSS animation class names.
 * Used to apply fade animations via pre-defined CSS rules.
 */
const ANIMATION_CLASSES = {
  FADE_IN: 'xeg-fade-in',
  FADE_OUT: 'xeg-fade-out',
} as const;

/**
 * Logs animation failures safely in development mode.
 *
 * @param message - Error message describing the animation failure
 * @param error - The underlying error object
 */
function safeLogAnimationFailure(message: string, error: unknown): void {
  if (__DEV__) {
    logger.warn(message, error);
  }
}

/**
 * Applies a CSS animation class to an element and waits for completion.
 *
 * Adds the specified animation class to the element, listens for the
 * `animationend` event, and removes the class when the animation completes.
 * Resolves successfully even if the animation fails or is not supported.
 *
 * @param element - The DOM element to animate
 * @param className - The CSS class name to apply
 * @returns A promise that resolves when the animation completes or fails
 */
function runCssAnimation(element: Element, className: string): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const handleAnimationEnd = (): void => {
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
 * Animates the gallery container's entry (fade-in).
 *
 * Applies the fade-in animation to the element and waits for completion.
 * The actual animation is defined in global CSS.
 *
 * @param element - The gallery container element to animate
 * @returns A promise that resolves when the fade-in animation completes
 */
export async function animateGalleryEnter(element: Element): Promise<void> {
  return runCssAnimation(element, ANIMATION_CLASSES.FADE_IN);
}

/**
 * Animates the gallery container's exit (fade-out).
 *
 * Applies the fade-out animation to the element and waits for completion.
 * The actual animation is defined in global CSS.
 *
 * @param element - The gallery container element to animate
 * @returns A promise that resolves when the fade-out animation completes
 */
export async function animateGalleryExit(element: Element): Promise<void> {
  return runCssAnimation(element, ANIMATION_CLASSES.FADE_OUT);
}
