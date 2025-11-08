/**
 * @fileoverview Animation utilities - CSS-based system
 * @version 2.0.0 - Phase 2: Replaced Motion One with CSS animations
 *
 * @description
 * Performance-optimized animation system using CSS transitions and keyframes
 * Removed Motion One library dependency and optimized bundle size
 */

// Fully replaced with CSS-based animation system
export {
  injectAnimationStyles,
  animateGalleryEnter,
  animateGalleryExit,
  animateImageItemsEnter,
  cleanupAnimations,
  ANIMATION_CLASSES,
  ANIMATION_CONSTANTS,
  type CSSAnimationOptions,
} from './css-animations';
import { globalTimerManager } from './timer-management';

// Removed aliases: keep only official APIs (toolbarSlideDown/toolbarSlideUp)

// Replaced Motion One functions with CSS-based versions
type DurationToken = 'fast' | 'normal' | 'slow';
type EasingToken = 'standard' | 'decelerate' | 'accelerate';

interface AnimateCustomOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  durationToken?: DurationToken;
  easingToken?: EasingToken;
}

export const animateCustom = async (
  element: Element,
  keyframes: Record<string, string | number>,
  options?: AnimateCustomOptions
): Promise<void> => {
  // Convert to CSS transition (prioritize tokens)
  const htmlElement = element as HTMLElement;

  const TOKEN_DURATION_MS: Record<DurationToken, number> = {
    fast: 150,
    normal: 300,
    slow: 500,
  } as const;

  const durationVar = options?.durationToken
    ? `var(--xeg-duration-${options.durationToken})`
    : typeof options?.duration === 'number'
      ? `${options.duration}ms`
      : 'var(--xeg-duration-normal)';

  const easingVar = options?.easingToken
    ? `var(--xeg-ease-${options.easingToken})`
    : (options?.easing ?? 'var(--xeg-ease-standard)');

  const delayMs = options?.delay ?? 0;
  const durationMs = options?.durationToken
    ? TOKEN_DURATION_MS[options.durationToken]
    : (options?.duration ?? 300);

  return new Promise<void>(resolve => {
    const transition = Object.keys(keyframes)
      .map(prop => `${prop} ${durationVar} ${easingVar}`)
      .join(', ');

    htmlElement.style.transition = transition;

    Object.entries(keyframes).forEach(([prop, value]) => {
      // Set styles only in browser environment
      if (typeof htmlElement.style.setProperty === 'function') {
        htmlElement.style.setProperty(prop, String(value));
      } else {
        // Fallback: direct assignment
        (htmlElement.style as CSSStyleDeclaration & Record<string, string>)[prop] = String(value);
      }
    });

    globalTimerManager.setTimeout(() => {
      resolve();
    }, durationMs + delayMs);
  });
};

// Replaced Motion One special features with simplified versions
export const setupScrollAnimation = (
  onScroll: (info: { scrollY: number; progress: number }) => void,
  container?: Element | null
): (() => void) => {
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(scrollY / maxScroll, 1);
    onScroll({ scrollY, progress });
  };

  const target = container || window;
  target.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    target.removeEventListener('scroll', handleScroll);
  };
};

// Phase 2: Expose JS preset paths as official API
export const toolbarSlideDown = async (element: Element): Promise<void> => {
  // Transition to final state (initial state managed by CSS or caller)
  return animateCustom(
    element,
    { opacity: '1', transform: 'translateY(0)' },
    {
      durationToken: 'fast',
      easingToken: 'decelerate',
    }
  );
};

export const toolbarSlideUp = async (element: Element): Promise<void> => {
  // Transition toolbar to hidden state (slide up)
  return animateCustom(
    element,
    { opacity: '0', transform: 'translateY(-100%)' },
    {
      durationToken: 'fast',
      easingToken: 'accelerate',
    }
  );
};
