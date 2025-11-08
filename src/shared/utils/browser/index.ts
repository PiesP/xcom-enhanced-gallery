/**
 * @fileoverview Browser Utils Barrel Export
 * @version 2.0.0 - Phase 352: Named export optimization
 *
 * Re-export browser environment safe access utilities
 */

export {
  isExtensionEnvironment,
  isBrowserEnvironment,
  safeWindow,
  safeLocation,
  safeNavigator,
  isTwitterSite,
  getCurrentUrlInfo,
  setScrollPosition,
  safeSetTimeout,
  safeClearTimeout,
  getViewportSize,
  getDevicePixelRatio,
  matchesMediaQuery,
  isDarkMode,
  prefersReducedMotion,
  getBrowserInfo,
  isExtensionContext,
} from './safe-browser';

export { waitForWindowLoad } from './wait-for-load';
