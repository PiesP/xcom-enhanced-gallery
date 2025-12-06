/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Cookie Service Module Entry Point
 * @description Re-exports functional API and provides legacy class compatibility
 * @version 4.0.0 - Functional refactor
 */

// Legacy class compatibility layer
export { CookieService, getCookieService } from './cookie-service.legacy';
// Primary exports - Pure functions (recommended)
export {
  deleteCookie,
  getCookieValue,
  getCookieValueSync,
  hasNativeAccess,
  listCookies,
  resetCookieAPICache,
  setCookie,
} from './cookie-utils';
