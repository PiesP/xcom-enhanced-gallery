/**
 * @fileoverview Deprecated compatibility exports for browser module.
 * Moved out of barrel to satisfy barrel export hygiene rules.
 */

import { BrowserService } from './browser-service';
import {
  isBrowserEnvironment,
  safeWindow,
  isExtensionEnvironment,
  saveScrollPosition,
  restoreScrollPosition,
  clearScrollPosition,
  getPageInfo,
} from './browser-environment';

// @deprecated - Use BrowserService directly
export const browserAPI = BrowserService;

// @deprecated - Use specific functions from browser-environment directly
export const browserUtils = {
  isBrowserEnvironment,
  safeWindow,
  isExtensionEnvironment,
  saveScrollPosition,
  restoreScrollPosition,
  clearScrollPosition,
  getPageInfo,
};
