/**
 * @fileoverview Twitter Bearer Token Dynamic Extraction Service
 * @description Dynamically extracts Bearer token from Twitter page at runtime
 *
 * @location src/shared/services/token-extraction/
 * @reason Token extraction is a shared utility used by multiple features, moved to shared/services
 *         Original location: src/features/settings/services/ (Phase 192 refactor)
 */

import { logger } from '@shared/logging';
import { HttpRequestService } from '@shared/services/http-request-service';
import { globalTimerManager } from '../../utils/timer-management';

/**
 * Token extraction result
 */
export interface TokenExtractionResult {
  success: boolean;
  token?: string;
  error?: string;
  source: 'network' | 'script' | 'config' | 'fallback';
  timestamp: number;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  reason?: string;
  remainingTime?: number;
}

/**
 * Twitter Bearer Token Dynamic Extraction Service
 *
 * Features:
 * - Detect Bearer token from network requests
 * - Extract token from script tags
 * - Token validation
 * - Automatic refresh mechanism
 * - Fallback token management
 */
export class TwitterTokenExtractor {
  private currentToken: string | null = null;
  private extractionAttempts = 0;
  private readonly maxExtractionAttempts = 10;
  private initialized = false;
  private extractionTimer: number | null = null;

  // Fallback tokens (publicly known tokens)
  private readonly fallbackTokens = [
    'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    'AAAAAAAAAAAAAAAAAAAAAPYXBAAAAAAACLXUNDekMxqa8h%2F40K4moUkGsoc%3DTYfbDKbT3jJPCEVnMYqilB28NHfOPqkca3qaAxGfsyKCs0wRbw',
  ];

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    try {
      // Start network request monitoring
      this.startNetworkMonitoring();

      // Attempt token extraction
      const result = await this.extractToken();
      if (result.success && result.token) {
        this.currentToken = result.token;
        logger.info(`Bearer token extraction successful (${result.source})`);
      } else {
        logger.warn('Initial token extraction failed, switching to automatic extraction mode');
        this.startPeriodicExtraction();
      }

      this.initialized = true;
      logger.debug('TwitterTokenExtractor initialization complete');
    } catch (error) {
      logger.error('TwitterTokenExtractor initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Service cleanup
   */
  cleanup(): void {
    if (this.extractionTimer) {
      globalTimerManager.clearInterval(this.extractionTimer);
      this.extractionTimer = null;
    }

    this.initialized = false;
    logger.debug('TwitterTokenExtractor cleanup complete');
  }

  /**
   * Get current token
   * @param forceRefresh Force token refresh if true
   */
  async getToken(forceRefresh = false): Promise<string | null> {
    if (forceRefresh || !this.currentToken) {
      const result = await this.extractToken();
      if (result.success && result.token) {
        this.currentToken = result.token;
      }
    }

    return this.currentToken;
  }

  /**
   * Validate token
   *
   * @param token Token to validate (optional, defaults to current token)
   * @returns Validation result
   */
  async validateToken(token?: string): Promise<TokenValidationResult> {
    const targetToken = token || this.currentToken;

    if (!targetToken) {
      return {
        valid: false,
        reason: 'No token available',
      };
    }

    // Basic format validation
    if (!this.isValidTokenFormat(targetToken)) {
      return {
        valid: false,
        reason: 'Invalid token format',
      };
    }

    // Validate through actual API call
    try {
      const validationResult = await this.verifyTokenWithAPI(targetToken);
      return validationResult;
    } catch (error) {
      logger.warn('Token API validation failed, falling back to format validation:', error);
      // If API validation fails, return format validation result
      return {
        valid: true,
        remainingTime: 3600000, // Assume 1 hour if format is correct
      };
    }
  }

  /**
   * Force token refresh
   */
  async refreshToken(): Promise<TokenExtractionResult> {
    this.extractionAttempts = 0;
    return await this.extractToken();
  }

  // Private methods

  /**
   * Token extraction (main logic)
   */
  private async extractToken(): Promise<TokenExtractionResult> {
    this.extractionAttempts++;
    // Priority: page(script) → cookie/session → config(PersistentStorage) → (auxiliary)network hints → fallback

    // 1. Attempt extraction from script tags (page highest priority)
    const scriptResult = await this.extractFromScripts();
    if (scriptResult.success) {
      return scriptResult;
    }

    // 2. Attempt extraction from cookie/session storage
    const cookieSessionResult = await this.extractFromCookieSession();
    if (cookieSessionResult.success) {
      return cookieSessionResult;
    }

    // 3. Attempt extraction from settings(LocalStorage: xeg-app-settings)
    const configResult = await this.extractFromConfig();
    if (configResult.success) {
      return configResult;
    }

    // 4. (Optional) Network monitor hints — not actual token acquisition
    const networkResult = await this.extractFromNetwork();
    if (networkResult.success) {
      return networkResult;
    }

    // 5. Use fallback token
    if (this.extractionAttempts >= this.maxExtractionAttempts) {
      logger.warn('Maximum extraction attempts reached, using fallback token');
      return this.useFallbackToken();
    }

    return {
      success: false,
      error: 'All token extraction methods failed',
      source: 'network',
      timestamp: Date.now(),
    };
  }

  /**
   * Extract token from cookie/session storage
   * Priority: cookie(auth_token) → sessionStorage(auth_token)
   */
  private async extractFromCookieSession(): Promise<TokenExtractionResult> {
    try {
      // 1) cookie: auth_token
      const cookie = typeof document !== 'undefined' ? document.cookie : '';
      if (cookie) {
        const match = cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
        const token = match?.[1];
        if (token && this.isValidTokenFormat(token)) {
          return {
            success: true,
            token,
            source: 'config',
            timestamp: Date.now(),
          };
        }
      }

      // 2) sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        const sToken = sessionStorage.getItem('auth_token');
        if (sToken && this.isValidTokenFormat(sToken)) {
          return {
            success: true,
            token: sToken,
            source: 'config',
            timestamp: Date.now(),
          };
        }
      }

      return {
        success: false,
        error: 'No token in cookie/sessionStorage',
        source: 'config',
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.debug('Cookie/session token extraction error:', error);
      return {
        success: false,
        error: String(error),
        source: 'config',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Extract token from network requests
   */
  private async extractFromNetwork(): Promise<TokenExtractionResult> {
    try {
      // Use Performance API to check recent network requests
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      for (const entry of entries.slice(-50)) {
        // Check only last 50 requests
        // Enhanced security with URL host verification
        try {
          const url = new URL(entry.name);
          const isTwitterAPI =
            url.hostname === 'api.twitter.com' ||
            (url.hostname === 'x.com' && url.pathname.startsWith('/i/api'));

          if (isTwitterAPI) {
            // Cannot access Authorization header from actual requests for security
            // Instead, verify if request URL pattern suggests token-relevant request
            if (this.isTokenRelevantRequest(entry.name)) {
              logger.debug(`Token-relevant request detected: ${entry.name}`);
              // Token extraction from network is difficult at this point, switch to other methods
            }
          }
        } catch {
          // Skip on URL parsing failure
          continue;
        }
      }

      return {
        success: false,
        error: 'Token extraction from network failed',
        source: 'network',
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.debug('Network token extraction error:', error);
      return {
        success: false,
        error: String(error),
        source: 'network',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Extract token from script tags
   */
  private async extractFromScripts(): Promise<TokenExtractionResult> {
    try {
      const scripts = document.querySelectorAll('script');

      for (const script of scripts) {
        if (script.textContent) {
          // Search for Twitter's Bearer token pattern
          const tokenMatches = script.textContent.match(/["']Bearer["']:\s*["']([^"']+)["']/g);

          if (tokenMatches) {
            for (const match of tokenMatches) {
              const tokenMatch = match.match(/["']([^"']+)["']\s*$/);
              if (tokenMatch?.[1]) {
                const token = tokenMatch[1];
                if (this.isValidTokenFormat(token)) {
                  logger.debug('Token extraction from script successful');
                  return {
                    success: true,
                    token,
                    source: 'script',
                    timestamp: Date.now(),
                  };
                }
              }
            }
          }

          // Try other patterns
          const patterns = [
            /bearerToken["']?\s*[:=]\s*["']([^"']+)["']/i,
            /authorization["']?\s*[:=]\s*["']Bearer\s+([^"']+)["']/i,
            /"BEARER_TOKEN":\s*"([^"]+)"/i,
          ];

          for (const pattern of patterns) {
            const match = script.textContent.match(pattern);
            if (match?.[1] && this.isValidTokenFormat(match[1])) {
              logger.debug('Token extraction from script successful (pattern matching)');
              return {
                success: true,
                token: match[1],
                source: 'script',
                timestamp: Date.now(),
              };
            }
          }
        }
      }

      return {
        success: false,
        error: 'Token not found in scripts',
        source: 'script',
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.debug('Script token extraction error:', error);
      return {
        success: false,
        error: String(error),
        source: 'script',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Extract token from settings
   */
  private async extractFromConfig(): Promise<TokenExtractionResult> {
    try {
      // Check token configured from SettingsService
      // Access safely through PersistentStorage
      const { PersistentStorage } = await import('@shared/services');
      const storage = PersistentStorage.getInstance();
      const settings = await storage.get<{ tokens?: { bearerToken?: string } }>('xeg-app-settings');
      if (settings) {
        const token = settings.tokens?.bearerToken;

        if (token && this.isValidTokenFormat(token)) {
          logger.debug('Token extraction from settings successful');
          return {
            success: true,
            token,
            source: 'config',
            timestamp: Date.now(),
          };
        }
      }

      return {
        success: false,
        error: 'No token in settings',
        source: 'config',
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.debug('Settings token extraction error:', error);
      return {
        success: false,
        error: String(error),
        source: 'config',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Use fallback token
   */
  private useFallbackToken(): TokenExtractionResult {
    for (const token of this.fallbackTokens) {
      if (this.isValidTokenFormat(token)) {
        logger.info('Using fallback token');
        return {
          success: true,
          token,
          source: 'fallback',
          timestamp: Date.now(),
        };
      }
    }

    return {
      success: false,
      error: 'All fallback tokens failed',
      source: 'fallback',
      timestamp: Date.now(),
    };
  }

  /**
   * Token format validation
   */
  private isValidTokenFormat(token: string): boolean {
    // Basic format validation for Twitter Bearer token
    return (
      typeof token === 'string' &&
      token.length > 50 &&
      token.includes('AA') && // Twitter tokens usually start with AA
      token.includes('%') // Contains URL-encoded characters
    );
  }

  /**
   * Check if request is token-relevant
   */
  private isTokenRelevantRequest(url: string): boolean {
    const patterns = ['/1.1/guest/activate.json', '/graphql/', '/i/api/1.1/', '/i/api/2/'];

    return patterns.some(pattern => url.includes(pattern));
  }

  /**
   * Start network monitoring
   */
  private startNetworkMonitoring(): void {
    // Real implementation needs Service Worker or more sophisticated method
    // Currently performs basic detection only
    logger.debug('Network monitoring started');
  }

  /**
   * Start periodic token extraction
   */
  private startPeriodicExtraction(): void {
    this.extractionTimer = globalTimerManager.setInterval(async () => {
      if (!this.currentToken) {
        const result = await this.extractToken();
        if (result.success && result.token) {
          this.currentToken = result.token;
          logger.info(`Periodic token extraction successful (${result.source})`);

          // Token found, stop periodic extraction
          if (this.extractionTimer) {
            globalTimerManager.clearInterval(this.extractionTimer);
            this.extractionTimer = null;
          }
        }
      }
    }, 5000); // Check every 5 seconds

    logger.debug('Periodic token extraction started');
  }

  /**
   * Verify token through API
   */
  private async verifyTokenWithAPI(token: string): Promise<TokenValidationResult> {
    try {
      // Simple authentication check for Twitter API via guest token request
      const httpService = HttpRequestService.getInstance();
      const response = await httpService.post<{ guest_token?: string }>(
        'https://api.twitter.com/1.1/guest/activate.json',
        undefined,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = response.data;
        if (data?.guest_token) {
          return {
            valid: true,
            remainingTime: 3600000, // 1 hour
          };
        }
      }

      // Response unsuccessful or guest_token missing
      return {
        valid: false,
        reason: `API response error: ${response.status}`,
      };
    } catch (error) {
      // Network error or other exception
      throw new Error(
        `Token verification API call failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
