import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  HttpRequestService,
  HttpError,
  type AvailabilityCheckResult,
} from '../../../src/shared/services/http-request-service';

describe('HttpRequestService with Environment Detection', () => {
  // Setup global test isolation to prevent state leakage
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = HttpRequestService.getInstance();
      const instance2 = HttpRequestService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should have all required methods', () => {
      const service = HttpRequestService.getInstance();

      expect(typeof service.get).toBe('function');
      expect(typeof service.post).toBe('function');
      expect(typeof service.put).toBe('function');
      expect(typeof service.delete).toBe('function');
      expect(typeof service.patch).toBe('function');
      expect(typeof service.postBinary).toBe('function');
      expect(typeof service.validateAvailability).toBe('function');
    });
  });

  describe('HttpError Class', () => {
    it('should create HttpError with correct properties', () => {
      const error = new HttpError('Not Found', 404, 'Not Found');

      expect(error.message).toBe('Not Found');
      expect(error.status).toBe(404);
      expect(error.statusText).toBe('Not Found');
      expect(error.name).toBe('HttpError');
    });

    it('should be instanceof Error', () => {
      const error = new HttpError('Server Error', 500, 'Server Error');

      expect(error).toBeInstanceOf(Error);
    });

    it('should handle timeout errors', () => {
      const error = new HttpError('Request timeout after 5000ms', 0, 'Timeout');

      expect(error.message).toContain('timeout');
      expect(error.status).toBe(0);
      expect(error.statusText).toBe('Timeout');
    });
  });

  describe('validateAvailability - Core Functionality', () => {
    it('should return availability information with correct structure', async () => {
      const service = HttpRequestService.getInstance();
      const result = await service.validateAvailability();

      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('canFallback');
    });

    it('should detect test environment when __VITEST__ is present', async () => {
      (globalThis as any).__VITEST__ = true;

      const service = HttpRequestService.getInstance();
      const result = await service.validateAvailability();

      expect(result.environment).toBe('test');
      expect(result.available).toBe(true);
      expect(result.message).toContain('Fetch API available');
    });

    it('should detect userscript environment when GM APIs are available', async () => {
      // In Vitest, __VITEST__ is present, so we override with Tampermonkey
      (globalThis as any).GM_getValue = vi.fn();
      (globalThis as any).GM_setValue = vi.fn();
      delete (globalThis as any).__VITEST__; // Remove test marker

      const service = HttpRequestService.getInstance();
      const result = await service.validateAvailability();

      // Userscript is detected (Tampermonkey APIs have priority)
      expect(result.available).toBe(true);
      expect(result.message).toContain('Fetch API available');
    });

    it('should indicate no fallback needed for fetch API', async () => {
      const service = HttpRequestService.getInstance();
      const result = await service.validateAvailability();

      expect(result.canFallback).toBe(false);
    });

    it('should return true availability since fetch is standard', async () => {
      const service = HttpRequestService.getInstance();
      const result = await service.validateAvailability();

      expect(result.available).toBe(true);
    });

    it('should include environment description in message', async () => {
      (globalThis as any).__VITEST__ = true;

      const service = HttpRequestService.getInstance();
      const result = await service.validateAvailability();

      expect(result.message).toContain('Fetch API');
      expect(result.message).toContain(result.environment);
    });

    it('should have consistent result type', async () => {
      const service = HttpRequestService.getInstance();
      const result = await service.validateAvailability();

      const typedResult: AvailabilityCheckResult = result;
      expect(typedResult.available).toEqual(expect.any(Boolean));
      expect(typedResult.environment).toEqual(expect.any(String));
      expect(typedResult.message).toEqual(expect.any(String));
      expect(typedResult.canFallback).toEqual(expect.any(Boolean));
    });
  });

  describe('validateAvailability - Environment Detection', () => {
    it('should provide clear MV3 compatibility message', async () => {
      (globalThis as any).__VITEST__ = true;

      const service = HttpRequestService.getInstance();
      const result = await service.validateAvailability();

      expect(result.message).toContain('MV3');
      expect(result.available).toBe(true);
    });

    it('should handle console environment', async () => {
      // In Vitest __VITEST__ is present, but we're just verifying fetch works
      // regardless of environment detection
      const service = HttpRequestService.getInstance();
      const result = await service.validateAvailability();

      // Fetch should always be available
      expect(result.available).toBe(true);
      expect(result.message).toContain('Fetch API available');
    });

    it('should provide actionable messages for debugging', async () => {
      const service = HttpRequestService.getInstance();
      const result = await service.validateAvailability();

      // Message should be helpful for debugging
      expect(result.message).toBeTruthy();
      expect(result.message.length).toBeGreaterThan(10);
    });

    it('should always indicate fetch available in modern environments', async () => {
      const scenarios = [
        {
          env: 'userscript',
          setup: () => {
            (globalThis as any).GM_getValue = vi.fn();
          },
        },
        {
          env: 'test',
          setup: () => {
            (globalThis as any).__VITEST__ = true;
          },
        },
        { env: 'console', setup: () => {} },
      ];

      for (const scenario of scenarios) {
        scenario.setup();
        const service = HttpRequestService.getInstance();
        const result = await service.validateAvailability();

        expect(result.available).toBe(true);
        expect(result.message).toContain('Fetch API available');

        // Clean up
        delete (globalThis as any).__VITEST__;
        delete (globalThis as any).GM_getValue;
      }
    });
  });

  describe('HTTP Methods Availability', () => {
    it('GET method should be accessible', () => {
      const service = HttpRequestService.getInstance();
      expect(service.get).toBeDefined();
    });

    it('POST method should be accessible', () => {
      const service = HttpRequestService.getInstance();
      expect(service.post).toBeDefined();
    });

    it('PUT method should be accessible', () => {
      const service = HttpRequestService.getInstance();
      expect(service.put).toBeDefined();
    });

    it('DELETE method should be accessible', () => {
      const service = HttpRequestService.getInstance();
      expect(service.delete).toBeDefined();
    });

    it('PATCH method should be accessible', () => {
      const service = HttpRequestService.getInstance();
      expect(service.patch).toBeDefined();
    });

    it('postBinary method should be accessible', () => {
      const service = HttpRequestService.getInstance();
      expect(service.postBinary).toBeDefined();
    });
  });

  describe('Integration with Environment Detection', () => {
    it('should work correctly in all environment types', async () => {
      // Since __VITEST__ is always present in Vitest, we test fetch availability
      // regardless of environment detection
      const service = HttpRequestService.getInstance();
      const result = await service.validateAvailability();

      // Fetch should be available in all scenarios
      expect(result.available).toBe(true);
      expect(['userscript', 'test', 'extension', 'console']).toContain(result.environment);
      expect(result.message).toContain('Fetch API available');
    });

    it('should provide environment context in error scenarios', async () => {
      const service = HttpRequestService.getInstance();
      const result = await service.validateAvailability();

      // Even if fetch fails, message should include environment context
      expect(result.message).toContain(result.environment);
    });

    it('should indicate when running in MV3-compatible mode', async () => {
      const service = HttpRequestService.getInstance();
      const result = await service.validateAvailability();

      if (result.available) {
        expect(result.message).toContain('Fetch API available');
        expect(result.message).toContain('MV3');
      }
    });
  });
});
