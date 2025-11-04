/**
 * Accessibility utilities module
 * @version 2.0.0 - Phase 352: Named export 최적화
 * Phase 104: 4개 모듈로 분해 (color-contrast, keyboard-navigation, aria-helpers, focus-restore-manager)
 */

// Color contrast utilities
export {
  safeParseInt,
  getRelativeLuminance,
  parseColor,
  calculateContrastRatio,
  calculateLuminance,
  meetsWCAGAA,
  meetsWCAGAAA,
  detectActualBackgroundColor,
  detectLightBackground,
  validateContrast,
  analyzeContrast,
  testContrastRatio,
  isWCAGAACompliant,
  isWCAGAAACompliant,
  isWCAGLargeTextAACompliant,
} from './color-contrast';

// Keyboard navigation utilities
export {
  enableKeyboardNavigation,
  disableKeyboardNavigation,
  enableWCAGKeyboardNavigation,
  manageFocus,
  enhanceFocusVisibility,
  validateKeyboardAccess,
  validateNavigationStructure,
  isFocusable,
  createFocusTrap,
  releaseKeyboardTrap,
} from './keyboard-navigation';

// ARIA helpers
export {
  addScreenReaderText,
  setAriaLabel,
  setAriaRole,
  setAriaLive,
  validateScreenReaderSupport,
  createNavigationLandmark,
  announceLiveMessage,
  validateAltTextQuality,
  setAriaAtomic,
  setAriaDescription,
  initializeLiveRegion,
  notifyScreenReader,
  associateLabel,
  setAccessibleName,
  setAccessibleDescription,
} from './aria-helpers';

// Focus restore manager
export type { FocusRestoreFn } from './focus-restore-manager';
export { beginFocusScope } from './focus-restore-manager';

// Live region manager
export {
  ensurePoliteLiveRegion,
  ensureAssertiveLiveRegion,
  getLiveRegionElements,
  cleanupLiveRegions,
  announce,
} from './live-region-manager';
