/**
 * @fileoverview Twitter Authentication - Pure functional implementation
 * @description Manages CSRF tokens required for Twitter GraphQL API requests.
 * @version 4.0.0 - Functional refactor from TwitterAuthService class
 */

import { logger } from "@shared/logging";
import { getCookieValue, getCookieValueSync } from "@shared/services/cookie";

// ============================================================================
// Module-level State (lazy initialized)
// ============================================================================

let _csrfToken: string | undefined;
let _tokensInitialized = false;
let _tokensInitializing = false;

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Initialize tokens from cookies.
 * Idempotent: only runs once per session unless reset.
 * @internal
 */
function initializeTokens(): void {
  if (_tokensInitialized || _tokensInitializing) {
    return;
  }

  _tokensInitializing = true;

  // Try synchronous access first
  const syncToken = getCookieValueSync("ct0");
  if (syncToken) {
    _csrfToken = syncToken;
    _tokensInitialized = true;
    _tokensInitializing = false;
    return;
  }

  // Fallback to async access if needed (though usually sync is enough for cookies)
  try {
    getCookieValue("ct0")
      .then((value) => {
        if (value) {
          _csrfToken = value;
          _tokensInitialized = true;
        }
      })
      .catch((error: unknown) => {
        logger.debug("Failed to hydrate CSRF token from GM_cookie", error);
      })
      .finally(() => {
        _tokensInitializing = false;
      });
  } catch (error) {
    // Ensure that tests or exotic environments that don't provide a Promise are silent
    logger.debug("Failed to call getCookieValue for CSRF hydration", error);
    _tokensInitializing = false;
  }
}

// ============================================================================
// Public API - Pure Functions
// ============================================================================

/**
 * Get the current CSRF token for Twitter API requests.
 *
 * Initializes tokens from cookies on first access. The token is cached
 * for subsequent calls within the same session.
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
  initializeTokens();
  return _csrfToken;
}

/**
 * Check if tokens have been initialized.
 *
 * @returns True if initialization has been attempted
 */
export function isTokensInitialized(): boolean {
  return _tokensInitialized;
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
  _tokensInitializing = false;
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
