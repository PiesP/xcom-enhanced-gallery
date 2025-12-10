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

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Initialize tokens from cookies.
 * Idempotent: only runs once per session unless reset.
 * @internal
 */
function initializeTokens(): void {
  if (_tokensInitialized) {
    return;
  }

  // Try synchronous access first
  _csrfToken = getCookieValueSync("ct0");

  // Fallback to async access if needed (though usually sync is enough for cookies)
  try {
    const maybePromise = getCookieValue("ct0") as unknown;
    if (maybePromise && typeof (maybePromise as any).then === "function") {
      (maybePromise as Promise<string | undefined>)
        .then((value) => {
          if (value) {
            _csrfToken = value;
          }
        })
        .catch((error: unknown) => {
          logger.debug("Failed to hydrate CSRF token from GM_cookie", error);
        });
    }
  } catch (error) {
    // Ensure that tests or exotic environments that don't provide a Promise are silent
    logger.debug("Failed to call getCookieValue for CSRF hydration", error);
  }

  _tokensInitialized = true;
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
