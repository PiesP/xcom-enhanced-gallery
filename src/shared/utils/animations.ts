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
