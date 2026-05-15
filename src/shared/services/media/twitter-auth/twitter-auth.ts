import { getCookieValue, getCookieValueSync } from '@shared/services/cookie/cookie-utils';

let _csrfToken: string | undefined;
let _tokensInitialized = false;

export function getCsrfToken(): string | undefined {
  if (_tokensInitialized) return _csrfToken;

  const syncToken = getCookieValueSync('ct0');
  if (syncToken) {
    _csrfToken = syncToken;
  }
  _tokensInitialized = true;
  return _csrfToken;
}

export async function getCsrfTokenAsync(): Promise<string | undefined> {
  if (_tokensInitialized && _csrfToken) return _csrfToken;

  const syncToken = getCookieValueSync('ct0');
  if (syncToken) {
    _csrfToken = syncToken;
    _tokensInitialized = true;
    return syncToken;
  }

  const asyncToken = await getCookieValue('ct0');
  _csrfToken = asyncToken ?? undefined;
  _tokensInitialized = true;
  return _csrfToken;
}

const FALLBACK_BEARER_TOKEN =
  'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

export function resolveBearerToken(): string {
  try {
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (nextDataScript?.textContent) {
      const nextData = JSON.parse(nextDataScript.textContent);
      const token = nextData?.props?.pageProps?.token?.Bearer ?? nextData?.props?.token?.Bearer;
      if (token && typeof token === 'string') {
        return `Bearer ${token}`;
      }
    }
  } catch {
    // Fall through to fallback
  }

  return FALLBACK_BEARER_TOKEN;
}
