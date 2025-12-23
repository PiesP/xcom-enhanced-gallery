/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Cookie Service - Functional API
 * @description Provides cookie management with GM_cookie support and document.cookie fallback
 * @version 4.0.0 - Functional refactor from CookieService class
 */

import { getUserscript } from '@shared/external/userscript';
import { logger } from '@shared/logging';
import type { CookieAPI, CookieListOptions, CookieRecord } from '@shared/types/core/cookie.types';
import { promisifyCallback } from '@shared/utils/async';
import { escapeRegExp } from '@shared/utils/text/formatting';

// ============================================================================
// Module State
// ============================================================================

let cachedCookieAPI: CookieAPI | null | undefined;

// ============================================================================
// Internal Utilities
// ============================================================================

function decode(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveCookieAPI(): CookieAPI | null {
  try {
    const userscript = getUserscript();
    if (userscript.cookie) {
      return userscript.cookie;
    }
  } catch (error) {
    // Ignore: fall back to document.cookie-only mode
    if (__DEV__) {
      logger.debug('[cookie-utils] Userscript cookie API resolution failed (ignored)', error);
    }
  }

  return null;
}

function getCookieAPI(): CookieAPI | null {
  if (cachedCookieAPI === undefined) {
    cachedCookieAPI = resolveCookieAPI();
  }
  return cachedCookieAPI;
}

function listFromDocument(options?: CookieListOptions): CookieRecord[] {
  if (typeof document === 'undefined' || typeof document.cookie !== 'string') {
    return [];
  }

  const domain =
    typeof document.location?.hostname === 'string' ? document.location.hostname : undefined;

  const records = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [rawName, ...rest] = entry.split('=');
      const nameDecoded = decode(rawName);
      if (!nameDecoded) {
        return null;
      }
      const value = decode(rest.join('=')) ?? '';
      const record: CookieRecord = {
        name: nameDecoded,
        value,
        path: '/',
        session: true,
        ...(domain ? { domain } : {}),
      };
      return record;
    })
    .filter((record): record is CookieRecord => Boolean(record));

  const filtered = options?.name
    ? records.filter((record) => record.name === options.name)
    : records;

  return filtered;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * List cookies matching the given options.
 * Falls back to document.cookie when GM_cookie is not available.
 */
async function listCookies(options?: CookieListOptions): Promise<CookieRecord[]> {
  const gmCookie = getCookieAPI();

  if (!gmCookie?.list) {
    return listFromDocument(options);
  }

  return promisifyCallback<CookieRecord[]>(
    (callback) =>
      gmCookie?.list(options, (cookies, error) => {
        if (error) {
          logger.warn('GM_cookie.list failed; falling back to document.cookie', error);
        }
        callback(error ? undefined : (cookies ?? []).map((c) => ({ ...c })), error);
      }),
    { fallback: () => listFromDocument(options) }
  );
}

/**
 * Get a cookie value by name asynchronously.
 * Uses GM_cookie.list when available, falls back to document.cookie.
 */
export async function getCookieValue(
  name: string,
  options?: CookieListOptions
): Promise<string | undefined> {
  if (!name) return undefined;

  const gmCookie = getCookieAPI();

  if (gmCookie?.list) {
    const cookies = await listCookies({ ...options, name });
    const value = cookies[0]?.value;
    if (value) {
      return value;
    }
  }

  return getCookieValueSync(name);
}

/**
 * Get a cookie value by name synchronously from document.cookie.
 */
export function getCookieValueSync(name: string): string | undefined {
  if (!name) return undefined;

  if (typeof document === 'undefined' || typeof document.cookie !== 'string') {
    return undefined;
  }

  const pattern = new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]*)`);
  const match = document.cookie.match(pattern);
  return decode(match?.[1]);
}
