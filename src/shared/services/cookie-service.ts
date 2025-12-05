/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Cookie Service Re-export
 * @description Re-exports from cookie/ module for backward compatibility
 * @version 4.0.0 - Functional refactor
 * @deprecated Import from '@shared/services/cookie' instead
 */

// Re-export everything from the new modular location
export {
  // Functional API (recommended)
  deleteCookie,
  getCookieValue,
  getCookieValueSync,
  hasNativeAccess,
  listCookies,
  resetCookieAPICache,
  setCookie,
  // Legacy class wrapper
  CookieService,
  getCookieService,
} from '@shared/services/cookie';
