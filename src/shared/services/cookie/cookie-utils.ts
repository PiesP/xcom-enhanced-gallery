/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Cookie Service - Functional API
 * @description Provides cookie management with GM_cookie support and document.cookie fallback
 * @version 4.0.0 - Functional refactor from CookieService class
 */

import { getUserscript } from '@shared/external/userscript/adapter';
import { logger } from '@shared/logging/logger';
import type {
  CookieAPI,
  CookieDeleteOptions,
  CookieListOptions,
  CookieRecord,
  CookieSetOptions,
} from '@shared/types/core/cookie.types';
import { promisifyCallback } from '@shared/utils/async/promise-helpers';
import { escapeRegExp } from '@shared/utils/text/formatting';

// ============================================================================
// Module State
// ============================================================================

let cachedCookieAPI: CookieAPI | null | undefined;

// ============================================================================
// Internal Utilities
// ============================================================================

const decode = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const encode = (value: string): string => {
  try {
    return encodeURIComponent(value);
  } catch {
    return value;
  }
};

const resolveCookieAPI = (): CookieAPI | null => {
  try {
    const userscript = getUserscript();
    return userscript.cookie ?? null;
  } catch (error) {
    // Ignore: fall back to document.cookie-only mode
    if (__DEV__) {
      logger.debug('[cookie-utils] Userscript cookie API resolution failed (ignored)', error);
    }
    return null;
  }
};

const getCookieAPI = (): CookieAPI | null => {
  if (cachedCookieAPI === undefined) {
    cachedCookieAPI = resolveCookieAPI();
  }
  return cachedCookieAPI;
};

/**
 * Reset the cached cookie API reference.
 * @internal For testing purposes only.
 */
export function resetCookieAPICache(): void {
  cachedCookieAPI = undefined;
}

const listFromDocument = (options?: CookieListOptions): CookieRecord[] => {
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
      if (!nameDecoded) return null;

      const record: CookieRecord = {
        name: nameDecoded,
        value: decode(rest.join('=')) ?? '',
        path: '/',
        session: true,
        ...(domain ? { domain } : {}),
      };
      return record;
    })
    .filter((record): record is CookieRecord => !!record);

  return options?.name ? records.filter((r) => r.name === options.name) : records;
};

const buildExpires = (expirationDate?: number): string | undefined => {
  if (typeof expirationDate !== 'number') return undefined;
  const epochMs = expirationDate > 1_000_000_000_000 ? expirationDate : expirationDate * 1000;
  return new Date(epochMs).toUTCString();
};

const setDocumentCookie = (details: CookieSetOptions & { name: string }): void => {
  if (typeof document === 'undefined') return;

  const { name, value, path = '/', domain, expirationDate, secure } = details;
  const parts = [`${encode(name)}=${encode(value ?? '')}`];

  if (path) parts.push(`path=${path}`);
  if (domain) parts.push(`domain=${domain}`);

  const expires = buildExpires(expirationDate);
  if (expires) parts.push(`expires=${expires}`);
  if (secure) parts.push('secure');

  document.cookie = parts.join('; ');
};

const deleteDocumentCookie = (details: CookieDeleteOptions): void => {
  if (typeof document === 'undefined') return;
  const { name, partitionKey: _partitionKey, ...rest } = details;
  setDocumentCookie({ ...rest, name, value: '', expirationDate: 0 });
};

// ============================================================================
// Public API
// ============================================================================

/**
 * List cookies matching the given options.
 * Falls back to document.cookie when GM_cookie is not available.
 */
export async function listCookies(options?: CookieListOptions): Promise<CookieRecord[]> {
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
 * Set a cookie. Uses GM_cookie when available, falls back to document.cookie.
 */
export async function setCookie(details: CookieSetOptions): Promise<void> {
  if (!details?.name) {
    throw new Error('Cookie name is required');
  }

  const gmCookie = getCookieAPI();
  const normalizedDetails = details as CookieSetOptions & { name: string };

  if (!gmCookie?.set) {
    setDocumentCookie(normalizedDetails);
    return;
  }

  await promisifyCallback<void>(
    (callback) => gmCookie.set?.(normalizedDetails, (error) => callback(undefined, error)),
    { fallback: () => setDocumentCookie(normalizedDetails) }
  );
}

/**
 * Delete a cookie by name. Uses GM_cookie when available, falls back to document.cookie.
 */
export async function deleteCookie(details: CookieDeleteOptions): Promise<void> {
  if (!details?.name) {
    throw new Error('Cookie name is required');
  }

  const gmCookie = getCookieAPI();

  if (!gmCookie?.delete) {
    deleteDocumentCookie(details);
    return;
  }

  await promisifyCallback<void>(
    (callback) => gmCookie.delete?.(details, (error) => callback(undefined, error)),
    { fallback: () => deleteDocumentCookie(details) }
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
