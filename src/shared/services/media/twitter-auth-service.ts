import { getCookieService } from "@shared/services/cookie-service";
import { logger } from "@shared/logging";

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
    if (this._tokensInitialized) {
      return;
    }

    // Try synchronous access first
    this._csrfToken = this.cookieService.getValueSync("ct0");

    // Fallback to async access if needed (though usually sync is enough for cookies)
    void this.cookieService
      .getValue("ct0")
      .then((value) => {
        if (value) {
          this._csrfToken = value;
        }
      })
      .catch((error) => {
        logger.debug("Failed to hydrate CSRF token from GM_cookie", error);
      });

    this._tokensInitialized = true;
  }

  /**
   * Get the current CSRF token.
   * Initializes tokens if not yet done.
   */
  public static get csrfToken(): string | undefined {
    this.initializeTokens();
    return this._csrfToken;
  }
}
