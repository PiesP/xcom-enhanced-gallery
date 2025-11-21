/**
 * @fileoverview DOM Utilities Barrel Export
 * @version Phase 326.7: Removed isInsideGallery (now internal to core-utils)
 */

// CSS validation utilities
export {
  isValidCSSSelector,
  calculateSelectorComplexity,
  hasPerformanceIssues,
} from './css-validation';

// Gallery DOM utilities
export {
  ensureGalleryScrollAvailable,
  isVideoControlElement,
  isGalleryInternalElement,
  canTriggerGallery,
  isGalleryContainer,
  isGalleryInternalEvent,
} from './gallery-dom';
