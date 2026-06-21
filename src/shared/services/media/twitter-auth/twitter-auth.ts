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

/** Shape of the __NEXT_DATA__ JSON for type-safe parsing. */
interface NextDataShape {
  props?: {
    pageProps?: {
      token?: {
        Bearer?: unknown;
      };
    };
    token?: {
      Bearer?: unknown;
    };
  };
}

function extractBearerFromNextData(nextData: unknown): string | null {
  if (typeof nextData !== 'object' || nextData === null) return null;
  const data = nextData as NextDataShape;
  const token = data?.props?.pageProps?.token?.Bearer ?? data?.props?.token?.Bearer;
  if (typeof token === 'string' && token.length > 10) return token;
  return null;
}

export function resolveBearerToken(): string {
  try {
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (nextDataScript?.textContent) {
      const nextData = JSON.parse(nextDataScript.textContent);
      const token = extractBearerFromNextData(nextData);
      if (token) return `Bearer ${token}`;
    }
  } catch {
    // Fall through to fallback
  }

  return TWITTER_API_CONFIG.GUEST_AUTHORIZATION;
}
