/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Cookie Service Module Entry Point
 * @description Functional cookie API with GM_cookie support and document.cookie fallback
 * @version 5.0.0 - Removed legacy class wrapper
 */

export {
  deleteCookie,
  getCookieValue,
  getCookieValueSync,
  hasNativeAccess,
  listCookies,
  resetCookieAPICache,
  setCookie,
} from './cookie-utils';
