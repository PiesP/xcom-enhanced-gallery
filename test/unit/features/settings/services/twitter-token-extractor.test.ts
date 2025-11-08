import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';

type TwitterTokenExtractorModule =
  typeof import('@shared/services/token-extraction/twitter-token-extractor');

async function importModule(): Promise<TwitterTokenExtractorModule> {
  vi.resetModules();
  return await import('@shared/services/token-extraction/twitter-token-extractor');
}

describe('TwitterTokenExtractor', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    document.body.innerHTML = '';
    document.cookie = '';
    // eslint-disable-next-line no-undef
    if (typeof localStorage !== 'undefined') localStorage.clear();
    // eslint-disable-next-line no-undef
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([]);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const { TwitterTokenExtractor } = await importModule();
      const extractor = new TwitterTokenExtractor();
      await extractor.initialize();
      expect(extractor.isInitialized()).toBe(true);
      await extractor.cleanup();
    });

    it('should cleanup resources', async () => {
      const { TwitterTokenExtractor } = await importModule();
      const extractor = new TwitterTokenExtractor();
      await extractor.initialize();
      await extractor.cleanup();
      expect(extractor.isInitialized()).toBe(false);
    });

    it('should initialize with token from script tag', async () => {
      const validToken =
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
      document.body.innerHTML = `<script>{"Bearer": "${validToken}"}</script>`;
      const { TwitterTokenExtractor } = await importModule();
      const extractor = new TwitterTokenExtractor();
      await extractor.initialize();
      expect(extractor.isInitialized()).toBe(true);
      expect(await extractor.getToken()).toBe(validToken);
      await extractor.cleanup();
    });
  });

  describe('token extraction priority', () => {
    it('should extract token from script tag (priority 1)', async () => {
      const scriptToken = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA%3D1ScriptTokenExample';
      document.body.innerHTML = `<script>{"Bearer": "${scriptToken}"}</script>`;
      document.cookie = 'auth_token=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA%3D1CookieToken';
      const { TwitterTokenExtractor } = await importModule();
      const extractor = new TwitterTokenExtractor();
      await extractor.initialize();
      expect(await extractor.getToken()).toBe(scriptToken);
      await extractor.cleanup();
    });

    it('should extract token from cookie when script fails (priority 2)', async () => {
      const cookieToken = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA%3D1CookieTokenExample';
      document.cookie = `auth_token=${cookieToken}`;
      const { TwitterTokenExtractor } = await importModule();
      const extractor = new TwitterTokenExtractor();
      await extractor.initialize();
      expect(await extractor.getToken()).toBe(cookieToken);
      await extractor.cleanup();
    });
  });

  describe('fallback and error handling', () => {
    it('should handle malformed cookie data gracefully', async () => {
      document.cookie = 'auth_token=invalid';
      const { TwitterTokenExtractor } = await importModule();
      const extractor = new TwitterTokenExtractor();
      await extractor.initialize();
      expect(extractor.isInitialized()).toBe(true);
      await extractor.cleanup();
    });
  });

  describe('token validation', () => {
    it('should validate token format correctly', async () => {
      const validToken = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA%3D1ValidTokenExample';
      document.cookie = `auth_token=${validToken}`;
      const { TwitterTokenExtractor } = await importModule();
      const extractor = new TwitterTokenExtractor();
      await extractor.initialize();
      const validation = await extractor.validateToken();
      expect(validation.valid).toBe(true);
      await extractor.cleanup();
    });

    it('should reject invalid token format', async () => {
      const { TwitterTokenExtractor } = await importModule();
      const extractor = new TwitterTokenExtractor();
      await extractor.initialize();
      const validation = await extractor.validateToken('short');
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('유효하지 않은 토큰 형식');
      await extractor.cleanup();
    });
  });
});
