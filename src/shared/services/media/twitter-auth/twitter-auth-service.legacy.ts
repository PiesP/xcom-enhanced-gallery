/**
 * @fileoverview Legacy TwitterAuthService class for backward compatibility
 * @deprecated Use functional API from './twitter-auth' instead
 * @version 4.0.0
 */

import { getCsrfToken } from './twitter-auth';

/**
 * @deprecated Use functional API instead:
 * - `getCsrfToken()` - Get CSRF token
 * - `isTokensInitialized()` - Check initialization status
 * - `resetTokens()` - Reset for testing
 *
 * @example
 * ```typescript
 * // Before (deprecated):
 * TwitterAuthService.csrfToken
 *
 * // After (recommended):
 * import { getCsrfToken } from '@shared/services/media/twitter-auth';
 * getCsrfToken();
 * ```
 */
export class TwitterAuthService {
  /**
   * @deprecated Use `getCsrfToken()` function instead
   */
  public static get csrfToken(): string | undefined {
    return getCsrfToken();
  }
}
