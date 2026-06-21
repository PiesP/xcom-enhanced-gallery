// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Cookie utilities: document.cookie-based cookie access.
 */

import type {
  CookieDeleteOptions,
  CookieListOptions,
  CookieRecord,
  CookieSetOptions,
} from '@shared/types/core/cookie.types';
import { escapeRegExp } from '@shared/utils/text/formatting';

function parseDocumentCookies(filterName?: string): CookieRecord[] {
  const cookieStr = document.cookie;
  if (!cookieStr) return [];

  return cookieStr
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const eqIdx = entry.indexOf('=');
      const name = eqIdx >= 0 ? entry.slice(0, eqIdx) : entry;
      const value = eqIdx >= 0 ? entry.slice(eqIdx + 1) : '';
      return { name, value, path: '/', session: true } as CookieRecord;
    })
    .filter((r) => !filterName || r.name === filterName);
}

function setDocumentCookie(name: string, value: string, expires?: string): void {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`, 'path=/'];
  if (expires) parts.push(`expires=${expires}`);
  document.cookie = parts.join('; ');
}

function deleteDocumentCookie(name: string): void {
  setDocumentCookie(name, '', 'Thu, 01 Jan 1970 00:00:00 GMT');
}

export async function listCookies(options?: CookieListOptions): Promise<CookieRecord[]> {
  // Prefer document.cookie (no GM_cookie needed for non-HttpOnly cookies).
  // Only use GM_cookie when explicitly needed for HttpOnly cookies.
  return parseDocumentCookies(options?.name);
}

export async function setCookie(details: CookieSetOptions): Promise<void> {
  if (!details?.name) throw new Error('Cookie name is required');
  setDocumentCookie(details.name, details.value ?? '');
}

export async function deleteCookie(details: CookieDeleteOptions): Promise<void> {
  if (!details?.name) throw new Error('Cookie name is required');
  deleteDocumentCookie(details.name);
}

export async function getCookieValue(name: string): Promise<string | undefined> {
  if (!name) return undefined;

  // GM_cookie is no longer granted — use document.cookie directly.
  return getCookieValueSync(name);
}

export function getCookieValueSync(name: string): string | undefined {
  if (!name) return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]*)`));
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
