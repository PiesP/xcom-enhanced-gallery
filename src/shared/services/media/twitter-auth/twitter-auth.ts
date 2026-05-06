import { delay } from '@shared/async/delay';
import { getExponentialBackoffDelayMs } from '@shared/async/retry';
import { logger } from '@shared/logging/logger';
import { getCookieValue, getCookieValueSync } from '@shared/services/cookie/cookie-utils';

// ============================================================================
// Configuration
// ============================================================================

/** Maximum retry attempts for async token fetch */
const MAX_RETRY_ATTEMPTS = 3;

/** Base delay for exponential backoff (ms) */
const BASE_RETRY_DELAY_MS = 100;

// ============================================================================
// Module-level State (lazy initialized)
// ============================================================================

let _csrfToken: string | undefined;
let _tokensInitialized = false;
let _initPromise: Promise<string | undefined> | null = null;

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Calculate exponential backoff delay.
 * @param attempt - Current attempt number (0-indexed)
 * @returns Delay in milliseconds
 * @internal
 */
const getBackoffDelay = (attempt: number): number =>
  getExponentialBackoffDelayMs(attempt, BASE_RETRY_DELAY_MS);

/**
 * Attempt to fetch CSRF token with exponential backoff retry.
 * @internal
 */
const fetchTokenWithRetry = async (): Promise<string | undefined> => {
  // Try synchronous access first (fastest path)
  const syncToken = getCookieValueSync('ct0');
  if (syncToken) {
    if (__DEV__) {
      logger.debug('CSRF token retrieved synchronously');
    }
    return syncToken;
  }

  // Async fetch with exponential backoff
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const value = await getCookieValue('ct0');
      if (value) {
        if (__DEV__) {
          logger.debug(`CSRF token retrieved asynchronously (attempt ${attempt + 1})`);
        }
        return value;
      }

      // Token not found, wait before retry
      if (attempt < MAX_RETRY_ATTEMPTS - 1) {
        const delayMs = getBackoffDelay(attempt);
        if (__DEV__) {
          logger.debug(`CSRF token not found, retrying in ${delayMs}ms (attempt ${attempt + 1})`);
        }
        await delay(delayMs);
      }
    } catch (error: unknown) {
      if (attempt < MAX_RETRY_ATTEMPTS - 1) {
        const delayMs = getBackoffDelay(attempt);
        if (__DEV__) {
          logger.debug(`CSRF token fetch failed, retrying in ${delayMs}ms`, error);
        }
        await delay(delayMs);
      } else {
        if (__DEV__) {
          logger.info('Failed to retrieve CSRF token after all retry attempts', error);
        }
      }
    }
  }

  if (__DEV__) {
    logger.info('CSRF token initialization completed without finding token');
  }
  return undefined;
};

/**
 * Initialize tokens from cookies (synchronous, non-blocking).
 * Used for backward compatibility with getCsrfToken().
 * @internal
 */
const initializeTokensSync = (): void => {
  if (_tokensInitialized) {
    return;
  }

  // Try synchronous access only
  const syncToken = getCookieValueSync('ct0');
  if (syncToken) {
    _csrfToken = syncToken;
    _tokensInitialized = true;
    if (__DEV__) {
      logger.debug('CSRF token initialized synchronously');
    }
  }
};

// ============================================================================
// Public API - Pure Functions
// ============================================================================

/**
 * Initialize tokens asynchronously with retry support.
 *
 * This function should be called during application startup to ensure
 * the CSRF token is available before making API requests.
 *
 * Features:
 * - Synchronous cookie access first (fastest path)
 * - Async fallback with exponential backoff retry
 * - Deduplicates concurrent initialization calls
 * - Caches result for subsequent calls
 *
 * @returns Promise resolving to the CSRF token or undefined
 *
 * @example
 * ```typescript
 * // During app initialization
 * await initTokens();
 *
 * // Later, use synchronous getter
 * const token = getCsrfToken();
 * ```
 */
const initTokens = async (): Promise<string | undefined> => {
  // Return cached token if already initialized
  if (_tokensInitialized && _csrfToken) {
    return _csrfToken;
  }

  // Deduplicate concurrent calls
  if (_initPromise) {
    return _initPromise;
  }

  _initPromise = (async () => {
    try {
      const token = await fetchTokenWithRetry();
      _csrfToken = token;
      _tokensInitialized = true;
      return token;
    } finally {
      _initPromise = null;
    }
  })();

  return _initPromise;
};

/**
 * Get the current CSRF token for Twitter API requests.
 *
 * Attempts synchronous initialization on first access. For guaranteed
 * token availability, use initTokens() during app startup.
 *
 * @returns CSRF token string or undefined if not available
 *
 * @example
 * ```typescript
 * const headers = {
 *   'x-csrf-token': getCsrfToken() ?? '',
 * };
 * ```
 */
export function getCsrfToken(): string | undefined {
  initializeTokensSync();
  return _csrfToken;
}

/**
 * Get CSRF token asynchronously, initializing if needed.
 *
 * Combines initialization and retrieval in one call. Useful when
 * you need to ensure the token is available before proceeding.
 *
 * @returns Promise resolving to CSRF token or undefined
 *
 * @example
 * ```typescript
 * const token = await getCsrfTokenAsync();
 * if (!token) {
 *   throw new Error('Authentication required');
 * }
 * ```
 */
export async function getCsrfTokenAsync(): Promise<string | undefined> {
  // Return cached token immediately if available
  if (_tokensInitialized && _csrfToken) {
    return _csrfToken;
  }

  return initTokens();
}

// ============================================================================
// Bearer Token Resolution
// ============================================================================

/**
 * Default/fallback Bearer token for guest access to Twitter API.
 *
 * @remarks
 * This token provides unauthenticated read-only access to public tweet and
 * user data. It is used only as a fallback when runtime extraction from the
 * X.com page fails.
 */
const FALLBACK_BEARER_TOKEN =
  'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

/**
 * Resolve the Bearer token for Twitter API requests at runtime.
 *
 * Attempts to extract the token dynamically from the X.com page's
 * `__NEXT_DATA__` script. Falls back to the hardcoded default if
 * extraction fails.
 *
 * **Extraction strategy**:
 * 1. Locate `#__NEXT_DATA__` script element on the page
 * 2. Parse its JSON content
 * 3. Extract the Bearer token from `props.pageProps.token.Bearer`
 *    or `props.token.Bearer` (X.com structure dependent)
 *
 * @returns A Bearer token string (always prefixed with "Bearer ")
 *
 * @example
 * ```typescript
 * const headers = new Headers({
 *   authorization: resolveBearerToken(),
 * });
 * ```
 */
export function resolveBearerToken(): string {
  try {
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (nextDataScript?.textContent) {
      const nextData = JSON.parse(nextDataScript.textContent);
      // X.com의 __NEXT_DATA__ 구조에서 Bearer 토큰 찾기
      const token = nextData?.props?.pageProps?.token?.Bearer ?? nextData?.props?.token?.Bearer;
      if (token && typeof token === 'string') {
        return `Bearer ${token}`;
      }
    }
  } catch {
    // 파싱 실패 시 무시하고 폴백 사용
  }

  // Fallback: 런타임 수집 실패 시 하드코딩된 기본값 사용
  return FALLBACK_BEARER_TOKEN;
}
