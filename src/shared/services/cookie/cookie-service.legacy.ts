/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Legacy CookieService Class Wrapper
 * @description Provides backward compatibility for code using the CookieService class
 * @version 4.0.0 - Legacy wrapper for functional refactor
 * @deprecated Use functional exports from '@shared/services/cookie' instead
 */

import type {
  CookieDeleteOptions,
  CookieListOptions,
  CookieRecord,
  CookieSetOptions,
} from '@shared/types/core/cookie.types';
import {
  deleteCookie,
  getCookieValue,
  getCookieValueSync,
  hasNativeAccess,
  listCookies,
  resetCookieAPICache,
  setCookie,
} from './cookie-utils';

/**
 * Legacy CookieService class wrapper.
 * @deprecated Use functional exports from '@shared/services/cookie' instead:
 * - `hasNativeAccess()` for checking GM_cookie availability
 * - `listCookies()` for listing cookies
 * - `getCookieValue()` for async value retrieval
 * - `getCookieValueSync()` for sync value retrieval
 * - `setCookie()` for setting cookies
 * - `deleteCookie()` for deleting cookies
 */
export class CookieService {
  private static _instance: CookieService | null = null;

  /**
   * Allows tests to reset the singleton via direct assignment.
   * Setting to null/undefined also resets the cookie API cache.
   */
  static get instance(): CookieService | null {
    return CookieService._instance;
  }

  static set instance(value: CookieService | null) {
    CookieService._instance = value;
    if (value == null) {
      resetCookieAPICache();
    }
  }

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): CookieService {
    if (!CookieService._instance) {
      CookieService._instance = new CookieService();
    }
    return CookieService._instance;
  }

  /**
   * @deprecated Use `hasNativeAccess()` function instead
   */
  hasNativeAccess(): boolean {
    return hasNativeAccess();
  }

  /**
   * @deprecated Use `listCookies()` function instead
   */
  async list(options?: CookieListOptions): Promise<CookieRecord[]> {
    return listCookies(options);
  }

  /**
   * @deprecated Use `getCookieValue()` function instead
   */
  async getValue(name: string, options?: CookieListOptions): Promise<string | undefined> {
    return getCookieValue(name, options);
  }

  /**
   * @deprecated Use `getCookieValueSync()` function instead
   */
  getValueSync(name: string): string | undefined {
    return getCookieValueSync(name);
  }

  /**
   * @deprecated Use `setCookie()` function instead
   */
  async set(details: CookieSetOptions): Promise<void> {
    return setCookie(details);
  }

  /**
   * @deprecated Use `deleteCookie()` function instead
   */
  async delete(details: CookieDeleteOptions): Promise<void> {
    return deleteCookie(details);
  }

  /**
   * Reset the singleton instance for testing.
   * @internal
   */
  static resetInstance(): void {
    CookieService._instance = null;
    resetCookieAPICache();
  }
}

/**
 * Get the CookieService singleton instance.
 * @deprecated Use functional exports from '@shared/services/cookie' instead
 */
export function getCookieService(): CookieService {
  return CookieService.getInstance();
}
