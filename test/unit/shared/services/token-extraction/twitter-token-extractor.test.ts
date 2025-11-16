/**
 * TwitterTokenExtractor Unit Tests
 *
 * @description Token extraction and validation behaviour coverage
 * @category Unit Test - Services
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
interface TestTokenExtractionResult {
  success: boolean;
  token?: string;
  error?: string;
  source: 'script' | 'cookie' | 'session' | 'storage' | 'unknown';
  timestamp: number;
}

interface TestTokenValidationResult {
  valid: boolean;
  reason?: string;
  remainingTime?: number;
}

interface TwitterTokenExtractorInstance {
  initialize(): Promise<void>;
  cleanup(): void;
  isInitialized(): boolean;
  getToken(forceRefresh?: boolean): Promise<string | null>;
  refreshToken(): Promise<TestTokenExtractionResult>;
  validateToken(token?: string): Promise<TestTokenValidationResult>;
}

interface TwitterTokenExtractorConstructor {
  new (): TwitterTokenExtractorInstance;
}

const mockHttpService = {
  post: vi.fn(),
};

const mockPersistentStorage = {
  get: vi.fn(),
};

const mockCookieService = {
  getValueSync: vi.fn(),
  getValue: vi.fn(),
  list: vi.fn(),
  hasNativeAccess: vi.fn(() => false),
};

vi.mock('@shared/services/http-request-service', () => ({
  HttpRequestService: {
    getInstance: vi.fn(() => mockHttpService),
  },
}));

vi.mock('@shared/services/persistent-storage', () => ({
  getPersistentStorage: vi.fn(() => mockPersistentStorage),
}));

vi.mock('@shared/services/cookie-service', () => ({
  getCookieService: vi.fn(() => mockCookieService),
}));

const VALID_TEST_TOKEN =
  'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

function appendScriptWithToken(token: string) {
  const script = document.createElement('script');
  script.dataset.testid = 'token-script';
  script.textContent = `window.__CONFIG__ = { "Bearer": "${token}" };`;
  document.body.appendChild(script);
  return script;
}

describe('TwitterTokenExtractor', () => {
  setupGlobalTestIsolation();

  let extractor: TwitterTokenExtractorInstance;

  beforeEach(async () => {
    vi.resetModules();
    const { TwitterTokenExtractor } = (await import(
      '../../../../../src/shared/services/token-extraction/twitter-token-extractor'
    )) as { TwitterTokenExtractor: TwitterTokenExtractorConstructor };
    extractor = new TwitterTokenExtractor();
    vi.clearAllMocks();
    mockHttpService.post.mockReset();
    mockPersistentStorage.get.mockReset();
    mockPersistentStorage.get.mockResolvedValue(null);
    mockCookieService.getValueSync.mockReset();
    mockCookieService.getValue.mockReset();
    mockCookieService.list.mockReset();
    mockCookieService.hasNativeAccess.mockReset();
    mockCookieService.getValueSync.mockReturnValue(undefined);
    mockCookieService.getValue.mockResolvedValue(undefined);
    const storage = globalThis.sessionStorage;
    storage?.clear();
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.querySelectorAll('script[data-testid="token-script"]').forEach(node => node.remove());
  });

  afterEach(() => {
    extractor.cleanup();
  });

  describe('initialize', () => {
    it('marks extractor as initialized', async () => {
      expect(extractor.isInitialized()).toBe(false);
      await extractor.initialize();
      expect(extractor.isInitialized()).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('resets state', async () => {
      const script = appendScriptWithToken(VALID_TEST_TOKEN);
      await extractor.initialize();
      expect(await extractor.getToken()).toBe(VALID_TEST_TOKEN);

      extractor.cleanup();
      script.remove();

      expect(extractor.isInitialized()).toBe(false);
      expect(await extractor.getToken()).toBeNull();
    });
  });

  describe('getToken', () => {
    it('returns null when no token exists', async () => {
      const token = await extractor.getToken();
      expect(token).toBeNull();
    });

    it('returns cached token without forcing refresh', async () => {
      appendScriptWithToken(VALID_TEST_TOKEN);
      await extractor.refreshToken();

      const first = await extractor.getToken();
      const second = await extractor.getToken();

      expect(first).toBe(VALID_TEST_TOKEN);
      expect(second).toBe(VALID_TEST_TOKEN);
    });

    it('forces refresh when requested', async () => {
      appendScriptWithToken(VALID_TEST_TOKEN);
      await extractor.refreshToken();

      const token = await extractor.getToken(true);
      expect(token).toBe(VALID_TEST_TOKEN);
    });
  });

  describe('refreshToken', () => {
    it('captures tokens from script tags', async () => {
      const script = appendScriptWithToken(VALID_TEST_TOKEN);
      const result = await extractor.refreshToken();

      expect(result).toMatchObject<TestTokenExtractionResult>({
        success: true,
        token: VALID_TEST_TOKEN,
        source: 'script',
        timestamp: expect.any(Number),
      });

      script.remove();
    });

    it('captures tokens from cookies', async () => {
      mockCookieService.getValue.mockResolvedValueOnce(VALID_TEST_TOKEN);

      const result = await extractor.refreshToken();
      expect(result.success).toBe(true);
      expect(result.source).toBe('cookie');
    });

    it('captures tokens from session storage', async () => {
      const storage = globalThis.sessionStorage;
      storage?.setItem('auth_token', VALID_TEST_TOKEN);

      const result = await extractor.refreshToken();
      expect(result.success).toBe(true);
      expect(result.source).toBe('session');
    });

    it('captures tokens from persistent storage', async () => {
      mockPersistentStorage.get.mockResolvedValue({
        tokens: { bearerToken: VALID_TEST_TOKEN },
      });

      const result = await extractor.refreshToken();
      expect(result.success).toBe(true);
      expect(result.source).toBe('storage');
    });

    it('returns failure when no sources succeed', async () => {
      const result = await extractor.refreshToken();
      expect(result.success).toBe(false);
      expect(result.source).toBe('unknown');
    });
  });

  describe('validateToken', () => {
    it('returns invalid for missing token', async () => {
      const result = await extractor.validateToken();
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('No token available');
    });

    it('rejects malformed tokens', async () => {
      const result = await extractor.validateToken('invalid-token');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid token format');
    });

    it('accepts well-formed tokens when API succeeds', async () => {
      mockHttpService.post.mockResolvedValue({
        ok: true,
        data: { guest_token: 'guest' },
        status: 200,
      });

      const result = await extractor.validateToken(VALID_TEST_TOKEN);
      expect(result.valid).toBe(true);
      expect(result.remainingTime).toBe(3600000);
    });

    it('relays API error reason on failure', async () => {
      mockHttpService.post.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await extractor.validateToken(VALID_TEST_TOKEN);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('API response error: 401');
    });

    it('falls back to format validation on API exception', async () => {
      mockHttpService.post.mockRejectedValue(new Error('network error'));

      const result = await extractor.validateToken(VALID_TEST_TOKEN);
      expect(result.valid).toBe(true);
      expect(result.remainingTime).toBe(3600000);
    });
  });

  describe('integration', () => {
    it('runs initialization flow without token', async () => {
      await extractor.initialize();
      expect(extractor.isInitialized()).toBe(true);
      expect(await extractor.getToken()).toBeNull();
    });

    it('maintains cached token across calls', async () => {
      appendScriptWithToken(VALID_TEST_TOKEN);
      await extractor.initialize();

      const first = await extractor.getToken();
      const second = await extractor.getToken();
      expect(first).toBe(second);
    });
  });
});
