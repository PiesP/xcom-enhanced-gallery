/**
 * @fileoverview Twitter Bearer Token extraction service
 * @description Minimal runtime token discovery used by shared services layer
 */

import { logger } from '@shared/logging';

// Known static bearer token for X.com (Twitter) web client
// This token has been stable for years and is used by the official web client
const WEB_CLIENT_BEARER_TOKEN =
  'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

export type TokenSource = 'constant' | 'script' | 'unknown';

export interface TokenExtractionResult {
  success: boolean;
  token?: string;
  error?: string;
  source: TokenSource;
  timestamp: number;
}

export interface TokenValidationResult {
  valid: boolean;
  reason?: string;
  remainingTime?: number;
}

export class TwitterTokenExtractor {
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
    logger.debug('TwitterTokenExtractor initialized (using static token)');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  cleanup(): void {
    this.initialized = false;
  }

  async getToken(): Promise<string> {
    return WEB_CLIENT_BEARER_TOKEN;
  }

  async refreshToken(): Promise<TokenExtractionResult> {
    return {
      success: true,
      token: WEB_CLIENT_BEARER_TOKEN,
      source: 'constant',
      timestamp: Date.now(),
    };
  }

  async validateToken(token?: string): Promise<TokenValidationResult> {
    const targetToken = token ?? WEB_CLIENT_BEARER_TOKEN;
    return {
      valid: targetToken === WEB_CLIENT_BEARER_TOKEN,
      remainingTime: 3600000,
    };
  }
}
