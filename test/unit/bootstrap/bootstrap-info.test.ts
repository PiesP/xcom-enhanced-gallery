/**
 * @fileoverview Bootstrap Info Tests - Phase 314-5
 * @description Service availability checks, bootstrap result reporting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { logger } from '../../../src/shared/logging';
import {
  checkServiceAvailability,
  logBootstrapSummary,
  getBootstrapDiagnostics,
  type ServiceAvailabilityInfo,
  type BootstrapResult,
} from '../../../src/bootstrap/bootstrap-info';

describe('Bootstrap Info - Phase 314-5', () => {
  // Setup global test isolation to prevent state leakage
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore global state after each test
    delete (globalThis as any).GM_getValue;
    delete (globalThis as any).GM_setValue;
    delete (globalThis as any).GM_download;
    delete (globalThis as any).GM_notification;
    delete (globalThis as any).__VITEST__;
    delete (globalThis as any).__PLAYWRIGHT__;
    delete (globalThis as any).__TAMPERMONKEY__;
  });

  describe('checkServiceAvailability', () => {
    it('should check HttpRequestService (fetch API)', async () => {
      const services = await checkServiceAvailability();
      const httpService = services.find(s => s.name === 'HttpRequestService');

      expect(httpService).toBeDefined();
      expect(httpService?.available).toBe(true); // fetch is always available
      expect(httpService?.message).toMatch(/fetch/i);
    });

    it('should check NotificationService availability', async () => {
      const services = await checkServiceAvailability();
      const notificationService = services.find(s => s.name === 'NotificationService');

      expect(notificationService).toBeDefined();
      expect(typeof notificationService?.available).toBe('boolean');
      expect(notificationService?.message).toBeDefined();
    });

    it('should check DownloadService availability (GM_download)', async () => {
      const services = await checkServiceAvailability();
      const downloadService = services.find(s => s.name === 'DownloadService');

      expect(downloadService).toBeDefined();
      expect(downloadService?.available).toBe(false); // Not available in test
      expect(downloadService?.message).toContain('GM_download');
    });

    it('should check PersistentStorage availability (GM_setValue)', async () => {
      const services = await checkServiceAvailability();
      const storage = services.find(s => s.name === 'PersistentStorage');

      expect(storage).toBeDefined();
      expect(storage?.available).toBe(false); // Not available in test
      expect(storage?.message).toMatch(/GM_setValue|storage/i);
    });

    it('should return array of ServiceAvailabilityInfo', async () => {
      const services = await checkServiceAvailability();

      expect(Array.isArray(services)).toBe(true);
      expect(services.length).toBeGreaterThan(0);

      services.forEach(service => {
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('available');
        expect(service).toHaveProperty('message');
        expect(typeof service.available).toBe('boolean');
        expect(typeof service.message).toBe('string');
      });
    });
  });

  describe('logBootstrapSummary', () => {
    it('should log bootstrap result with success status', () => {
      const mockLogger = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const result: BootstrapResult = {
        success: true,
        environment: 'test',
        timestamp: new Date().toISOString(),
        services: [
          {
            name: 'TestService1',
            available: true,
            message: 'Available',
          },
          {
            name: 'TestService2',
            available: false,
            message: 'Not available',
          },
        ],
        warnings: [],
        errors: [],
      };

      logBootstrapSummary(result);
      expect(mockLogger).toHaveBeenCalled();

      mockLogger.mockRestore();
    });

    it('should log warnings if present', () => {
      const mockLogger = vi.spyOn(logger, 'warn').mockImplementation(() => {});

      const result: BootstrapResult = {
        success: true,
        environment: 'test',
        timestamp: new Date().toISOString(),
        services: [],
        warnings: ['Warning 1', 'Warning 2'],
        errors: [],
      };

      logBootstrapSummary(result);
      expect(mockLogger).toHaveBeenCalled();

      mockLogger.mockRestore();
    });

    it('should log errors if present', () => {
      const mockLogger = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const result: BootstrapResult = {
        success: false,
        environment: 'test',
        timestamp: new Date().toISOString(),
        services: [],
        warnings: [],
        errors: ['Error 1', 'Error 2'],
      };

      logBootstrapSummary(result);
      expect(mockLogger).toHaveBeenCalled();

      mockLogger.mockRestore();
    });
  });

  describe('getBootstrapDiagnostics', () => {
    it('should return BootstrapResult with all properties', async () => {
      const result = await getBootstrapDiagnostics();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('services');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('errors');

      expect(typeof result.success).toBe('boolean');
      expect(typeof result.environment).toBe('string');
      expect(typeof result.timestamp).toBe('string');
      expect(Array.isArray(result.services)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should include service availability checks', async () => {
      const result = await getBootstrapDiagnostics();

      expect(result.services.length).toBeGreaterThan(0);
      const serviceNames = result.services.map(s => s.name);
      expect(serviceNames).toContain('HttpRequestService');
      expect(serviceNames).toContain('NotificationService');
      expect(serviceNames).toContain('DownloadService');
      expect(serviceNames).toContain('PersistentStorage');
    });

    it('should set success to true when no errors occur', async () => {
      const result = await getBootstrapDiagnostics();
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should include timestamp in ISO format', async () => {
      const result = await getBootstrapDiagnostics();
      const parsedDate = new Date(result.timestamp);

      expect(parsedDate instanceof Date).toBe(true);
      expect(parsedDate.getTime()).not.toBeNaN();
    });

    it('should detect test environment', async () => {
      const result = await getBootstrapDiagnostics();

      expect(result.environment).toBe('test');
    });

    it('should provide detailed service information', async () => {
      const result = await getBootstrapDiagnostics();

      result.services.forEach(service => {
        expect(typeof service.name).toBe('string');
        expect(typeof service.available).toBe('boolean');
        expect(typeof service.message).toBe('string');
        expect(service.name.length).toBeGreaterThan(0);
        expect(service.message.length).toBeGreaterThan(0);
      });
    });
  });
});
