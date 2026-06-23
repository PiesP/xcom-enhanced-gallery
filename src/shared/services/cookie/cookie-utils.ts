// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Cookie utilities: GM_cookie adapter with document.cookie fallback.
 */

import { getUserscript } from '@shared/external/userscript/adapter';
import type { CookieAPI, CookieListOptions, CookieRecord } from '@shared/types/core/cookie.types';
import { escapeRegExp } from '@shared/utils/text/formatting';

type ResultCallback<TResult, TError = string | null | undefined> = (
  result?: TResult,
  error?: TError
) => void;

interface PromisifyOptions<TFallback> {
  readonly fallback?: () => TFallback | Promise<TFallback>;
}

function promisifyCallback<TResult>(
  executor: (callback: ResultCallback<TResult>) => void,
  options?: PromisifyOptions<TResult>
): Promise<TResult> {
  return new Promise((resolve, reject) => {
    try {
      executor((result, error) => {
        if (error) {
          if (options?.fallback) {
            resolve(options.fallback());
          } else {
            reject(new Error(String(error)));
          }
          return;
        }
        resolve(result as TResult);
      });
    } catch (error) {
      if (options?.fallback) {
        resolve(options.fallback());
      } else {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
  });
}

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

export async function listCookies(options?: CookieListOptions): Promise<CookieRecord[]> {
  try {
    const gm = getCookieAPI();
    if (!gm?.list) return parseDocumentCookies(options?.name);

    // Scope cookie queries to the current domain to prevent cross-domain access
    const scopedOptions: CookieListOptions = {
      ...options,
      domain: options?.domain ?? document.location?.hostname ?? undefined,
    };

    return promisifyCallback<CookieRecord[]>(
      (cb) =>
        gm.list!(scopedOptions, (cookies, error) => {
          if (error) return cb(undefined, error);
          cb(
            (cookies ?? []).map((c) => ({ ...c })),
            undefined
          );
        }),
      { fallback: () => parseDocumentCookies(options?.name) }
    );
  } catch {
    return parseDocumentCookies(options?.name);
  }
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
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]*)`));
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
