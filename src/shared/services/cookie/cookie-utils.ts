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
import type {
  CookieAPI,
  CookieDeleteOptions,
  CookieListOptions,
  CookieRecord,
  CookieSetOptions,
} from '@shared/types/core/cookie.types';
import { promisifyCallback, promisifyVoidCallback } from '@shared/utils/async';

// ============================================================================
// Types
// ============================================================================

type CookieSetOptionsWithName = CookieSetOptions & { name: string };

interface GlobalWithCookie {
  GM_cookie?: CookieAPI;
}

// ============================================================================
// Module State
// ============================================================================

let cachedCookieAPI: CookieAPI | null | undefined = undefined;

// ============================================================================
// Internal Utilities
// ============================================================================

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decode(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function encode(value: string): string {
  try {
    return encodeURIComponent(value);
  } catch {
    return value;
  }
}

function buildDocumentCookieString(details: CookieSetOptionsWithName): string {
  const segments: string[] = [];
  const name = encode(details.name);
  const value = encode(details.value);
  segments.push(`${name}=${value}`);
  segments.push(`path=${details.path ?? '/'}`);
  if (details.domain) {
    segments.push(`domain=${details.domain}`);
  }
  if (details.expirationDate) {
    segments.push(`expires=${new Date(details.expirationDate * 1000).toUTCString()}`);
  }
  if (details.secure) {
    segments.push('secure');
  }
  if (details.httpOnly) {
    segments.push('HttpOnly');
  }
  return segments.join('; ');
}

function expireDocumentCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encode(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

function resolveCookieAPI(): CookieAPI | null {
  try {
    const userscript = getUserscript();
    if (userscript.cookie) {
      return userscript.cookie;
    }
  } catch {
    // Ignore: fall back to global probing below
  }

  const global = globalThis as GlobalWithCookie;
  if (global.GM_cookie && typeof global.GM_cookie.list === 'function') {
    return global.GM_cookie;
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
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(entry => {
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

  const filtered = options?.name ? records.filter(record => record.name === options.name) : records;

  return filtered;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Returns true when GM_cookie is available.
 */
export function hasNativeAccess(): boolean {
  return Boolean(getCookieAPI());
}

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
    callback =>
      gmCookie?.list(options, (cookies, error) => {
        if (error) {
          logger.warn('GM_cookie.list failed; falling back to document.cookie', error);
        }
        callback(error ? undefined : (cookies ?? []).map(c => ({ ...c })), error);
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

  const pattern = new RegExp(`(?:^|;\\s*)${escapeRegex(name)}=([^;]*)`);
  const match = document.cookie.match(pattern);
  return decode(match?.[1]);
}

/**
 * Set a cookie with the given options.
 * Uses GM_cookie.set when available, falls back to document.cookie.
 */
export async function setCookie(details: CookieSetOptions): Promise<void> {
  const name = details?.name;
  if (!name) {
    throw new Error('Cookie name is required');
  }

  const normalizedDetails: CookieSetOptionsWithName = {
    ...details,
    name,
  };

  const gmCookie = getCookieAPI();

  if (!gmCookie?.set) {
    if (typeof document === 'undefined') {
      throw new Error('Cannot set cookie: document is not available');
    }
    document.cookie = buildDocumentCookieString(normalizedDetails);
    return;
  }

  return promisifyVoidCallback(callback => gmCookie?.set?.(normalizedDetails, callback));
}

/**
 * Delete a cookie by name.
 * Uses GM_cookie.delete when available, falls back to expiring via document.cookie.
 */
export async function deleteCookie(details: CookieDeleteOptions): Promise<void> {
  if (!details?.name) {
    throw new Error('Cookie name is required');
  }

  const gmCookie = getCookieAPI();

  if (!gmCookie?.delete) {
    expireDocumentCookie(details.name);
    return;
  }

  return promisifyVoidCallback(callback => gmCookie?.delete?.(details, callback));
}

/**
 * Reset the cached cookie API reference.
 * @internal For testing purposes only.
 */
export function resetCookieAPICache(): void {
  cachedCookieAPI = undefined;
}
