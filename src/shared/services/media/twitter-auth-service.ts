import { logger } from '@shared/logging';
import { getCookieService } from '@shared/services/cookie-service';

/**
 * Twitter Authentication Service
 * Manages CSRF tokens required for Twitter GraphQL API requests.
 */
export class TwitterAuthService {
  private static _csrfToken: string | undefined = undefined;
  private static _tokensInitialized = false;
  private static readonly cookieService = getCookieService();

  /**
   * Initialize tokens from cookies.
   * Idempotent: only runs once per session unless reset.
   */
  private static initializeTokens(): void {
    if (TwitterAuthService._tokensInitialized) {
      return;
    }

    // Try synchronous access first
    TwitterAuthService._csrfToken = TwitterAuthService.cookieService.getValueSync('ct0');

    // Fallback to async access if needed (though usually sync is enough for cookies)
    void TwitterAuthService.cookieService
      .getValue('ct0')
      .then((value) => {
        if (value) {
          TwitterAuthService._csrfToken = value;
        }
      })
      .catch((error) => {
        logger.debug('Failed to hydrate CSRF token from GM_cookie', error);
      });

    TwitterAuthService._tokensInitialized = true;
  }

  /**
   * Get the current CSRF token.
   * Initializes tokens if not yet done.
   */
  public static get csrfToken(): string | undefined {
    TwitterAuthService.initializeTokens();
    return TwitterAuthService._csrfToken;
  }
}
