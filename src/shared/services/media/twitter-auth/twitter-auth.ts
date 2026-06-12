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

export function resolveBearerToken(): string {
  try {
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (nextDataScript?.textContent) {
      const nextData = JSON.parse(nextDataScript.textContent);
      const token = nextData?.props?.pageProps?.token?.Bearer ?? nextData?.props?.token?.Bearer;
      if (token && typeof token === 'string' && token.length > 10) {
        return `Bearer ${token}`;
      }
    }
  } catch {
    // Fall through to fallback
  }

  return TWITTER_API_CONFIG.GUEST_AUTHORIZATION;
}
