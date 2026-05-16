/**
 * @fileoverview CSS animation helpers for gallery entrance/exit effects.
 *
 * Lightweight helpers using pre-injected global CSS rules.
 * Keeps module small for minimal bundle size impact.
 */

/** CSS animation class names for fade effects. */
const ANIMATION_CLASSES = {
  FADE_IN: 'xeg-fade-in',
  FADE_OUT: 'xeg-fade-out',
} as const;

/**
 * Applies a CSS animation class to an element and waits for completion.
 *
 * Adds the animation class, listens for animationend event, and removes
 * the class when animation completes. Resolves on failure to ensure
 * graceful degradation if CSS animations are unsupported.
 *
 * @param element - The DOM element to animate
 * @param className - The CSS class name to apply
 * @returns Promise resolving when animation completes or fails
 */
function runCssAnimation(element: Element, className: string): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    const settle = (): void => {
      if (settled) return;
      settled = true;
      element.removeEventListener('animationend', settle);
      element.removeEventListener('animationcancel', settle);
      element.classList.remove(className);
      resolve();
    };

    try {
      element.addEventListener('animationend', settle, { once: true });
      element.addEventListener('animationcancel', settle, { once: true });

      // If element is already detached, resolve on next frame
      if (!element.isConnected) {
        requestAnimationFrame(settle);
        return;
      }

      element.classList.add(className);
    } catch {
      settle();
    }
  });
}

/**
 * Animates gallery container entrance with fade-in effect.
 *
 * @param element - Gallery container element to animate
 * @returns Promise resolving when fade-in completes
 */
export function animateGalleryEnter(element: Element): Promise<void> {
  return runCssAnimation(element, ANIMATION_CLASSES.FADE_IN);
}

/**
 * Animates gallery container exit with fade-out effect.
 *
 * @param element - Gallery container element to animate
 * @returns Promise resolving when fade-out completes
 */
export function animateGalleryExit(element: Element): Promise<void> {
  return runCssAnimation(element, ANIMATION_CLASSES.FADE_OUT);
}
