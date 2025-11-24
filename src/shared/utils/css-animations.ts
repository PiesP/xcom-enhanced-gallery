/**
 * @fileoverview CSS-based animation system - Motion One replacement
 * @version 2.0.0 - Phase 2: Simplify animation system
 *
 * @description
 * Performance-optimized animation system using CSS transitions and keyframes
 * Removed Motion One library dependency and optimized bundle size
 */

import { CSS } from "@/constants";
import { logger } from "@shared/logging";
import { getStyleRegistry } from "@shared/services/style-registry";
import { globalTimerManager } from "./timer-management";

// CSS animation variables and constants
export const ANIMATION_CONSTANTS = {
  DURATION_FAST: 150,
  DURATION_NORMAL: 300,
  DURATION_SLOW: 500,
  EASING_EASE_OUT: "cubic-bezier(0.4, 0, 0.2, 1)",
  EASING_EASE_IN: "cubic-bezier(0.4, 0, 1, 1)",
  EASING_EASE_IN_OUT: "cubic-bezier(0.4, 0, 0.2, 1)",
  STAGGER_DELAY: 50,
} as const;

// CSS class constants
export const ANIMATION_CLASSES = {
  FADE_IN: "animate-fade-in",
  FADE_OUT: "animate-fade-out",
  SLIDE_IN_BOTTOM: "animate-slide-in-bottom",
  SLIDE_OUT_TOP: "animate-slide-out-top",
  SCALE_IN: "animate-scale-in",
  SCALE_OUT: "animate-scale-out",
  IMAGE_LOAD: "animate-image-load",
  REDUCED_MOTION: "reduced-motion",
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
const ANIMATION_STYLE_ID = "xeg-animation-styles";
const ANIMATION_LAYER = "xeg.utilities";
const GALLERY_SCOPE_HOSTS = CSS.SCOPES.HOSTS;

const styleRegistry = getStyleRegistry();

const KEYFRAMES = {
  FADE_IN: "xeg-fade-in",
  FADE_OUT: "xeg-fade-out",
  SLIDE_IN_BOTTOM: "xeg-slide-in-bottom",
  SLIDE_OUT_TOP: "xeg-slide-out-top",
  SCALE_IN: "xeg-scale-in",
  SCALE_OUT: "xeg-scale-out",
  IMAGE_LOAD: "xeg-image-load",
} as const;

export function injectAnimationStyles(): void {
  if (styleRegistry.hasStyle(ANIMATION_STYLE_ID)) {
    return;
  }

  const cssText = buildScopedAnimationCss();
  styleRegistry.registerStyle({ id: ANIMATION_STYLE_ID, cssText });
  logger.debug("CSS animation styles registered via StyleRegistry.");
}

function buildScopedAnimationCss(): string {
  const scopedClass = (className: string): string =>
    GALLERY_SCOPE_HOSTS.map((scope) => `${scope} .${className}`).join(", ");
  const reducedMotionSelectors = [
    ANIMATION_CLASSES.FADE_IN,
    ANIMATION_CLASSES.FADE_OUT,
    ANIMATION_CLASSES.SLIDE_IN_BOTTOM,
    ANIMATION_CLASSES.SLIDE_OUT_TOP,
    ANIMATION_CLASSES.SCALE_IN,
    ANIMATION_CLASSES.SCALE_OUT,
    ANIMATION_CLASSES.IMAGE_LOAD,
  ]
    .map(scopedClass)
    .join(",\n      ");

  return `
@layer ${ANIMATION_LAYER} {
  @keyframes ${KEYFRAMES.FADE_IN} { from { opacity: 0; } to { opacity: 1; } }
  @keyframes ${KEYFRAMES.FADE_OUT} { from { opacity: 1; } to { opacity: 0; } }
  @keyframes ${KEYFRAMES.SLIDE_IN_BOTTOM} {
    from { opacity: 0; transform: translateY(1.25rem); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes ${KEYFRAMES.SLIDE_OUT_TOP} {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-1.25rem); }
  }
  @keyframes ${KEYFRAMES.SCALE_IN} {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes ${KEYFRAMES.SCALE_OUT} {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.95); }
  }
  @keyframes ${KEYFRAMES.IMAGE_LOAD} {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }

  ${scopedClass(ANIMATION_CLASSES.FADE_IN)} {
    animation: ${KEYFRAMES.FADE_IN} var(--xeg-duration-normal) var(--xeg-ease-standard) forwards;
  }
  ${scopedClass(ANIMATION_CLASSES.FADE_OUT)} {
    animation: ${KEYFRAMES.FADE_OUT} var(--xeg-duration-fast) var(--xeg-ease-accelerate) forwards;
  }
  ${scopedClass(ANIMATION_CLASSES.SLIDE_IN_BOTTOM)} {
    animation: ${KEYFRAMES.SLIDE_IN_BOTTOM} var(--xeg-duration-normal) var(--xeg-ease-decelerate) forwards;
  }
  ${scopedClass(ANIMATION_CLASSES.SLIDE_OUT_TOP)} {
    animation: ${KEYFRAMES.SLIDE_OUT_TOP} var(--xeg-duration-fast) var(--xeg-ease-accelerate) forwards;
  }
  ${scopedClass(ANIMATION_CLASSES.SCALE_IN)} {
    animation: ${KEYFRAMES.SCALE_IN} var(--xeg-duration-normal) var(--xeg-ease-standard) forwards;
  }
  ${scopedClass(ANIMATION_CLASSES.SCALE_OUT)} {
    animation: ${KEYFRAMES.SCALE_OUT} var(--xeg-duration-fast) var(--xeg-ease-accelerate) forwards;
  }
  ${scopedClass(ANIMATION_CLASSES.IMAGE_LOAD)} {
    animation: ${KEYFRAMES.IMAGE_LOAD} var(--xeg-duration-slow) var(--xeg-ease-decelerate) forwards;
  }

  @media (prefers-reduced-motion: reduce) {
      ${reducedMotionSelectors} {
        animation: none !important;
      }
  }
}
`;
}

/**
 * Gallery container entry animation (CSS-based)
 */
export async function animateGalleryEnter(
  element: Element,
  options: CSSAnimationOptions = {},
): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const handleAnimationEnd = () => {
        element.removeEventListener("animationend", handleAnimationEnd);
        element.classList.remove(ANIMATION_CLASSES.FADE_IN);
        options.onComplete?.();
        resolve();
      };

      element.addEventListener("animationend", handleAnimationEnd);
      element.classList.add(ANIMATION_CLASSES.FADE_IN);
    } catch (error) {
      logger.warn("Gallery entry animation failed:", error);
      resolve();
    }
  });
}

/**
 * Gallery container exit animation (CSS-based)
 */
export async function animateGalleryExit(
  element: Element,
  options: CSSAnimationOptions = {},
): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const handleAnimationEnd = () => {
        element.removeEventListener("animationend", handleAnimationEnd);
        element.classList.remove(ANIMATION_CLASSES.FADE_OUT);
        options.onComplete?.();
        resolve();
      };

      element.addEventListener("animationend", handleAnimationEnd);
      element.classList.add(ANIMATION_CLASSES.FADE_OUT);
    } catch (error) {
      logger.warn("Gallery exit animation failed:", error);
      resolve();
    }
  });
}

/**
 * Image items entry animation (stagger effect, CSS-based)
 */
export async function animateImageItemsEnter(
  elements: Element[],
): Promise<void> {
  return new Promise<void>((resolve) => {
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
            element.removeEventListener("animationend", handleAnimationEnd);
            element.classList.remove(ANIMATION_CLASSES.SLIDE_IN_BOTTOM);
            completedCount++;

            if (completedCount === totalElements) {
              resolve();
            }
          };

          element.addEventListener("animationend", handleAnimationEnd);
          element.classList.add(ANIMATION_CLASSES.SLIDE_IN_BOTTOM);
        }, delay);
      });
    } catch (error) {
      logger.warn("Image items entry animation failed:", error);
      resolve();
    }
  });
}

/**
 * Animation cleanup utility
 */
export function cleanupAnimations(element: Element): void {
  Object.values(ANIMATION_CLASSES).forEach((className) => {
    element.classList.remove(className);
  });

  const htmlElement = element as HTMLElement;
  htmlElement.style.animation = "";

  try {
    htmlElement.style.removeProperty("--animation-duration");
  } catch {
    // Ignore in mock environments without removeProperty
  }
}
