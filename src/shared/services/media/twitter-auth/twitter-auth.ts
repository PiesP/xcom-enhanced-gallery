/**
 * @fileoverview Twitter Authentication - Pure functional implementation
 * @description Manages CSRF tokens required for Twitter GraphQL API requests.
 * @version 5.0.0 - Added async initialization with exponential backoff
 */

import { delay } from '@shared/async/delay';
import { getExponentialBackoffDelayMs } from '@shared/core/twitter-auth/backoff';
import { logger } from '@shared/logging';
import { getCookieValue, getCookieValueSync } from '@shared/services/cookie';

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
function getBackoffDelay(attempt: number): number {
  return getExponentialBackoffDelayMs({ attempt, baseDelayMs: BASE_RETRY_DELAY_MS });
}

/**
 * Attempt to fetch CSRF token with exponential backoff retry.
 * @internal
 */
async function fetchTokenWithRetry(): Promise<string | undefined> {
  // Try synchronous access first (fastest path)
  const syncToken = getCookieValueSync('ct0');
  if (syncToken) {
    logger.debug('CSRF token retrieved synchronously');
    return syncToken;
  }

  // Async fetch with exponential backoff
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const value = await getCookieValue('ct0');
      if (value) {
        logger.debug(`CSRF token retrieved asynchronously (attempt ${attempt + 1})`);
        return value;
      }

      // Token not found, wait before retry
      if (attempt < MAX_RETRY_ATTEMPTS - 1) {
        const delayMs = getBackoffDelay(attempt);
        logger.debug(`CSRF token not found, retrying in ${delayMs}ms (attempt ${attempt + 1})`);
        await delay(delayMs);
      }
    } catch (error: unknown) {
      if (attempt < MAX_RETRY_ATTEMPTS - 1) {
        const delayMs = getBackoffDelay(attempt);
        logger.debug(`CSRF token fetch failed, retrying in ${delayMs}ms`, error);
        await delay(delayMs);
      } else {
        logger.info('Failed to retrieve CSRF token after all retry attempts', error);
      }
    }
  }

  logger.info('CSRF token initialization completed without finding token');
  return undefined;
}

/**
 * Initialize tokens from cookies (synchronous, non-blocking).
 * Used for backward compatibility with getCsrfToken().
 * @internal
 */
function initializeTokensSync(): void {
  if (_tokensInitialized) {
    return;
  }

  // Try synchronous access only
  const syncToken = getCookieValueSync('ct0');
  if (syncToken) {
    _csrfToken = syncToken;
    _tokensInitialized = true;
    logger.debug('CSRF token initialized synchronously');
  }
}

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
export async function initTokens(): Promise<string | undefined> {
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
}

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

/**
 * Check if tokens have been initialized.
 *
 * @returns True if initialization has completed
 */
export function isTokensInitialized(): boolean {
  return _tokensInitialized;
}

/**
 * Check if token initialization is currently in progress.
 *
 * @returns True if async initialization is pending
 */
export function isTokensInitializing(): boolean {
  return _initPromise !== null;
}

/**
 * Reset tokens to uninitialized state.
 * Useful for testing or forced re-initialization.
 *
 * @internal Primarily for testing
 */
export function resetTokens(): void {
  _csrfToken = undefined;
  _tokensInitialized = false;
  _initPromise = null;
}

/**
 * Manually set the CSRF token.
 * Useful for testing or when token is obtained from another source.
 *
 * @param token - CSRF token to set
 * @internal Primarily for testing
 */
export function setCsrfToken(token: string | undefined): void {
  _csrfToken = token;
  _tokensInitialized = true;
}
