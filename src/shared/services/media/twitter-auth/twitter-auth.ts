// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { TWITTER_API_CONFIG } from '@shared/core/twitter-api/endpoint';
import { getCookieValue, getCookieValueSync } from '@shared/services/cookie/cookie-utils';

export async function getCsrfTokenAsync(): Promise<string | undefined> {
  // ct0 cookie is readable synchronously (not HttpOnly)
  const syncToken = getCookieValueSync('ct0');
  if (syncToken) return syncToken;

  const asyncToken = await getCookieValue('ct0');
  return asyncToken ?? undefined;
}

/**
 * Resolve a Bearer token from __NEXT_DATA__ DOM element.
 *
 * @param document_ - Document instance (injectable for testability).
 *                     Defaults to `globalThis.document`. Pass a mock or
 *                     null in non-browser environments.
 * @returns Bearer token string (e.g. `Bearer AAAA...`) or the static
 *          guest authorization fallback.
 */
export function resolveBearerToken(document_?: Document | null | undefined): string {
  try {
    const doc = document_ ?? globalThis.document;
    if (!doc) return TWITTER_API_CONFIG.GUEST_AUTHORIZATION;

    const nextDataScript = doc.getElementById('__NEXT_DATA__');
    if (nextDataScript?.textContent) {
      const nextData = JSON.parse(nextDataScript.textContent);
      const token = nextData?.props?.pageProps?.token?.Bearer ?? nextData?.props?.token?.Bearer;
      if (token && typeof token === 'string' && isValidJwt(token)) {
        return `Bearer ${token}`;
      }
    }
  } catch {
    // Fall through to fallback
  }

  return TWITTER_API_CONFIG.GUEST_AUTHORIZATION;
}

/**
 * Basic JWT structure validation.
 * Checks for 3 dot-separated parts and verifies the exp claim is present and not expired.
 */
function isValidJwt(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1]!));
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
