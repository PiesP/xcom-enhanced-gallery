/**
 * @fileoverview Browser Utils Barrel Export
 * @version 2.0.0 - Phase 352: Named export 최적화
 *
 * 브라우저 환경 안전 접근 유틸리티 재익스포트
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
