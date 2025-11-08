/**
 * @fileoverview CSS-based animation system - Motion One replacement
 * @version 2.0.0 - Phase 2: Simplify animation system
 *
 * @description
 * Performance-optimized animation system using CSS transitions and keyframes
 * Removed Motion One library dependency and optimized bundle size
 */

import { logger } from '../logging';
import { globalTimerManager } from './timer-management';

// CSS animation variables and constants
export const ANIMATION_CONSTANTS = {
  DURATION_FAST: 150,
  DURATION_NORMAL: 300,
  DURATION_SLOW: 500,
  EASING_EASE_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  EASING_EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  EASING_EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  STAGGER_DELAY: 50,
} as const;

// CSS class constants
export const ANIMATION_CLASSES = {
  FADE_IN: 'animate-fade-in',
  FADE_OUT: 'animate-fade-out',
  SLIDE_IN_BOTTOM: 'animate-slide-in-bottom',
  SLIDE_OUT_TOP: 'animate-slide-out-top',
  SCALE_IN: 'animate-scale-in',
  SCALE_OUT: 'animate-scale-out',
  IMAGE_LOAD: 'animate-image-load',
  REDUCED_MOTION: 'reduced-motion',
} as const;

/**
 * CSS animation options interface
 */
export interface CSSAnimationOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  onComplete?: () => void;
}

/**
 * Inject CSS keyframes into DOM
 */
export function injectAnimationStyles(): void {
  const styleId = 'xcom-gallery-animations';

  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
    @keyframes slide-in-bottom {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slide-out-top {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-20px); }
    }
    @keyframes scale-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes scale-out {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.95); }
    }
    /* toolbar-slide-* keyframes removed: use JS API (toolbarSlideDown/Up) */
    @keyframes image-load {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }

  .animate-fade-in { animation: fade-in var(--xeg-duration-normal) var(--xeg-ease-standard) forwards; }
  .animate-fade-out { animation: fade-out var(--xeg-duration-fast) var(--xeg-ease-accelerate) forwards; }
  .animate-slide-in-bottom { animation: slide-in-bottom var(--xeg-duration-normal) var(--xeg-ease-decelerate) forwards; }
  .animate-slide-out-top { animation: slide-out-top var(--xeg-duration-fast) var(--xeg-ease-accelerate) forwards; }
  .animate-scale-in { animation: scale-in var(--xeg-duration-normal) var(--xeg-ease-standard) forwards; }
  .animate-scale-out { animation: scale-out var(--xeg-duration-fast) var(--xeg-ease-accelerate) forwards; }
  .animate-image-load { animation: image-load var(--xeg-duration-slow) var(--xeg-ease-decelerate) forwards; }

    @media (prefers-reduced-motion: reduce) {
      .animate-fade-in, .animate-fade-out, .animate-slide-in-bottom,
      .animate-slide-out-top, .animate-scale-in, .animate-scale-out,
      .animate-image-load {
        animation: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  logger.debug('CSS animation styles injected.');
}

/**
 * Gallery container entry animation (CSS-based)
 */
export async function animateGalleryEnter(
  element: Element,
  options: CSSAnimationOptions = {}
): Promise<void> {
  return new Promise<void>(resolve => {
    try {
      const handleAnimationEnd = () => {
        element.removeEventListener('animationend', handleAnimationEnd);
        element.classList.remove(ANIMATION_CLASSES.FADE_IN);
        options.onComplete?.();
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd);
      element.classList.add(ANIMATION_CLASSES.FADE_IN);
    } catch (error) {
      logger.warn('Gallery entry animation failed:', error);
      resolve();
    }
  });
}

/**
 * Gallery container exit animation (CSS-based)
 */
export async function animateGalleryExit(
  element: Element,
  options: CSSAnimationOptions = {}
): Promise<void> {
  return new Promise<void>(resolve => {
    try {
      const handleAnimationEnd = () => {
        element.removeEventListener('animationend', handleAnimationEnd);
        element.classList.remove(ANIMATION_CLASSES.FADE_OUT);
        options.onComplete?.();
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd);
      element.classList.add(ANIMATION_CLASSES.FADE_OUT);
    } catch (error) {
      logger.warn('Gallery exit animation failed:', error);
      resolve();
    }
  });
}

/**
 * Image items entry animation (stagger effect, CSS-based)
 */
export async function animateImageItemsEnter(elements: Element[]): Promise<void> {
  return new Promise<void>(resolve => {
    try {
      let completedCount = 0;
      const totalElements = elements.length;

      if (totalElements === 0) {
        resolve();
        return;
      }

      elements.forEach((element, index) => {
        const delay = index * ANIMATION_CONSTANTS.STAGGER_DELAY;

        // Use global timer manager for unified test/cleanup path
        globalTimerManager.setTimeout(() => {
          const handleAnimationEnd = () => {
            element.removeEventListener('animationend', handleAnimationEnd);
            element.classList.remove(ANIMATION_CLASSES.SLIDE_IN_BOTTOM);
            completedCount++;

            if (completedCount === totalElements) {
              resolve();
            }
          };

          element.addEventListener('animationend', handleAnimationEnd);
          element.classList.add(ANIMATION_CLASSES.SLIDE_IN_BOTTOM);
        }, delay);
      });
    } catch (error) {
      logger.warn('Image items entry animation failed:', error);
      resolve();
    }
  });
}

/**
 * Animation cleanup utility
 */
export function cleanupAnimations(element: Element): void {
  Object.values(ANIMATION_CLASSES).forEach(className => {
    element.classList.remove(className);
  });

  const htmlElement = element as HTMLElement;
  htmlElement.style.animation = '';

  try {
    htmlElement.style.removeProperty('--animation-duration');
  } catch {
    // Ignore in mock environments without removeProperty
  }
}
