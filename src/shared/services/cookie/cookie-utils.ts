/**
 * @fileoverview Cookie utilities: GM_cookie adapter with document.cookie fallback.
 */

import { getUserscript } from '@shared/external/userscript/adapter';
import type {
  CookieAPI,
  CookieDeleteOptions,
  CookieListOptions,
  CookieRecord,
  CookieSetOptions,
} from '@shared/types/core/cookie.types';
import { promisifyCallback } from '@shared/utils/async/promise-helpers';
import { escapeRegExp } from '@shared/utils/text/formatting';

let cachedCookieAPI: CookieAPI | null | undefined;

function resolveCookieAPI(): CookieAPI | null {
  try {
    return getUserscript().cookie ?? null;
  } catch {
    return null;
  }
}

function getCookieAPI(): CookieAPI | null {
  if (cachedCookieAPI === undefined) {
    cachedCookieAPI = resolveCookieAPI();
  }
  return cachedCookieAPI;
}

/** @internal For testing only */
export function resetCookieAPICache(): void {
  cachedCookieAPI = undefined;
}

function parseDocumentCookies(filterName?: string): CookieRecord[] {
  const cookieStr = document.cookie;
  if (!cookieStr) return [];

  const records = cookieStr
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const eqIdx = entry.indexOf('=');
      const name = eqIdx >= 0 ? entry.slice(0, eqIdx) : entry;
      const value = eqIdx >= 0 ? entry.slice(eqIdx + 1) : '';
      return { name, value, path: '/', session: true };
    });

  return filterName ? records.filter((r) => r.name === filterName) : records;
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
  const gm = getCookieAPI();
  if (!gm?.list) return parseDocumentCookies(options?.name);

  return promisifyCallback<CookieRecord[]>(
    (cb) => gm.list(options, (cookies, error) => {
      if (error) return cb(undefined, error);
      cb((cookies ?? []).map((c) => ({ ...c })), undefined);
    }),
    { fallback: () => parseDocumentCookies(options?.name) }
  );
}

export async function setCookie(details: CookieSetOptions): Promise<void> {
  if (!details?.name) throw new Error('Cookie name is required');

  const gm = getCookieAPI();
  if (!gm?.set) {
    setDocumentCookie(details.name, details.value ?? '');
    return;
  }

  await promisifyCallback<void>(
    (cb) => gm.set(details, (error) => cb(undefined, error)),
    { fallback: () => { setDocumentCookie(details.name, details.value ?? ''); } }
  );
}

export async function deleteCookie(details: CookieDeleteOptions): Promise<void> {
  if (!details?.name) throw new Error('Cookie name is required');

  const gm = getCookieAPI();
  if (!gm?.delete) {
    deleteDocumentCookie(details.name);
    return;
  }

  await promisifyCallback<void>(
    (cb) => gm.delete(details, (error) => cb(undefined, error)),
    { fallback: () => { deleteDocumentCookie(details.name); } }
  );
}

export async function getCookieValue(name: string): Promise<string | undefined> {
  if (!name) return undefined;

  const gm = getCookieAPI();
  if (gm?.list) {
    const cookies = await listCookies({ name });
    const value = cookies[0]?.value;
    if (value) return value;
  }

  return getCookieValueSync(name);
}

export function getCookieValueSync(name: string): string | undefined {
  if (!name) return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]*)`)
  );
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
