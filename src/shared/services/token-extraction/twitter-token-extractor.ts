/**
 * @fileoverview Twitter Bearer Token extraction service
 * @description Minimal runtime token discovery used by shared services layer
 */

import { logger } from '@shared/logging';
import { HttpRequestService } from '@shared/services/http-request-service';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import { getCookieService } from '@shared/services/cookie-service';

export type TokenSource = 'script' | 'cookie' | 'session' | 'storage';

export interface TokenExtractionResult {
  success: boolean;
  token?: string;
  error?: string;
  source: TokenSource | 'unknown';
  timestamp: number;
}

export interface TokenValidationResult {
  valid: boolean;
  reason?: string;
  remainingTime?: number;
}

type ExtractionStrategy = () => Promise<TokenExtractionResult | null>;

const SCRIPT_TOKEN_PATTERNS: RegExp[] = [
  /["']Bearer["']\s*[:=]\s*["']([^"']+)["']/g,
  /bearerToken["']?\s*[:=]\s*["']([^"']+)["']/gi,
  /authorization["']?\s*[:=]\s*["']Bearer\s+([^"']+)["']/gi,
  /"BEARER_TOKEN":\s*"([^"]+)"/g,
];

export class TwitterTokenExtractor {
  private currentToken: string | null = null;
  private initialized = false;
  private readonly cookieService = getCookieService();

  private readonly extractionStrategies: ExtractionStrategy[] = [
    () => this.extractFromScripts(),
    () => this.extractFromCookies(),
    () => this.extractFromSessionStorage(),
    () => this.extractFromPersistentStorage(),
  ];

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const result = await this.refreshToken();
    if (result.success && result.token) {
      logger.info(`Bearer token discovered from ${result.source}`);
    } else {
      logger.warn('Bearer token not available during initialization');
    }

    this.initialized = true;
    logger.debug('TwitterTokenExtractor initialized');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  cleanup(): void {
    this.currentToken = null;
    this.initialized = false;
    logger.debug('TwitterTokenExtractor cleanup complete');
  }

  async getToken(forceRefresh = false): Promise<string | null> {
    if (forceRefresh) {
      await this.refreshToken();
      return this.currentToken;
    }

    if (!this.currentToken) {
      await this.refreshToken();
    }

    return this.currentToken;
  }

  async refreshToken(): Promise<TokenExtractionResult> {
    const result = await this.extractToken();

    if (result.success && result.token) {
      this.currentToken = result.token;
    }

    return result;
  }

  async validateToken(token?: string): Promise<TokenValidationResult> {
    const targetToken = token ?? this.currentToken;

    if (!targetToken) {
      return {
        valid: false,
        reason: 'No token available',
      };
    }

    if (!this.isValidTokenFormat(targetToken)) {
      return {
        valid: false,
        reason: 'Invalid token format',
      };
    }

    try {
      return await this.verifyTokenWithAPI(targetToken);
    } catch (error) {
      logger.warn('Token API validation failed, using format validation only', error);
      return {
        valid: true,
        remainingTime: 3600000,
      };
    }
  }

  private async extractToken(): Promise<TokenExtractionResult> {
    for (const strategy of this.extractionStrategies) {
      try {
        const result = await strategy();
        if (result?.success) {
          return result;
        }
      } catch (error) {
        logger.debug('Token extraction strategy failed', error);
      }
    }

    return {
      success: false,
      error: 'Token not found',
      source: 'unknown',
      timestamp: Date.now(),
    };
  }

  private async extractFromScripts(): Promise<TokenExtractionResult | null> {
    if (typeof document === 'undefined') {
      return null;
    }

    try {
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent;
        if (!content) {
          continue;
        }

        const token = this.findTokenInScriptContent(content);
        if (token) {
          logger.debug('Token extracted from script content');
          return this.buildSuccessResult(token, 'script');
        }
      }
    } catch (error) {
      logger.debug('Script token extraction error', error);
    }

    return null;
  }

  private async extractFromCookies(): Promise<TokenExtractionResult | null> {
    try {
      const tokenFromGM = await this.cookieService.getValue('auth_token', {
        domain: '.twitter.com',
      });
      const token = tokenFromGM ?? this.cookieService.getValueSync('auth_token');
      if (token && this.isValidTokenFormat(token)) {
        logger.debug('Token extracted from cookie');
        return this.buildSuccessResult(token, 'cookie');
      }
    } catch (error) {
      logger.debug('Cookie token extraction error', error);
    }

    return null;
  }

  private async extractFromSessionStorage(): Promise<TokenExtractionResult | null> {
    try {
      const storage = globalThis.sessionStorage;
      const token = storage?.getItem('auth_token');
      if (token && this.isValidTokenFormat(token)) {
        logger.debug('Token extracted from session storage');
        return this.buildSuccessResult(token, 'session');
      }
    } catch (error) {
      logger.debug('Session storage token extraction error', error);
    }

    return null;
  }

  private async extractFromPersistentStorage(): Promise<TokenExtractionResult | null> {
    try {
      const storage = getPersistentStorage();
      const settings = await storage.get<{ tokens?: { bearerToken?: string } }>('xeg-app-settings');
      const token = settings?.tokens?.bearerToken;

      if (token && this.isValidTokenFormat(token)) {
        logger.debug('Token extracted from persistent storage');
        return this.buildSuccessResult(token, 'storage');
      }
    } catch (error) {
      logger.debug('Persistent storage token extraction error', error);
    }

    return null;
  }

  private buildSuccessResult(token: string, source: TokenSource): TokenExtractionResult {
    return {
      success: true,
      token,
      source,
      timestamp: Date.now(),
    };
  }

  private findTokenInScriptContent(content: string): string | null {
    for (const pattern of SCRIPT_TOKEN_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        const candidate = match[1];
        if (candidate && this.isValidTokenFormat(candidate)) {
          return candidate;
        }
      }
    }

    return null;
  }

  private isValidTokenFormat(token: string): boolean {
    return (
      typeof token === 'string' && token.length >= 60 && token.includes('AA') && token.includes('%')
    );
  }

  private async verifyTokenWithAPI(token: string): Promise<TokenValidationResult> {
    try {
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

      if (response.ok && response.data?.guest_token) {
        return {
          valid: true,
          remainingTime: 3600000,
        };
      }

      return {
        valid: false,
        reason: `API response error: ${response.status}`,
      };
    } catch (error) {
      throw new Error(
        `Token verification API call failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
