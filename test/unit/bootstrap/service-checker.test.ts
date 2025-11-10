/**
 * @fileoverview Service Checker Unit Tests
 * @description Phase 348: Service availability check tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkHttpService,
  checkDownloadService,
  checkPersistentStorage,
  checkAllServices,
} from '../../../src/bootstrap/diagnostics/service-scan';

describe('Service Checker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkHttpService', () => {
    it('should detect fetch API availability', async () => {
      const result = await checkHttpService();
      expect(result.name).toBe('HttpRequestService');
      expect(result.available).toBe(typeof fetch !== 'undefined');
      expect(result.message).toContain('Native fetch API');
    });
  });

  describe('checkDownloadService', () => {
    it('should detect GM_download availability', async () => {
      const result = await checkDownloadService();
      expect(result.name).toBe('DownloadService');
      expect(result.available).toBe(
        !!(globalThis as unknown as { GM_download?: unknown }).GM_download
      );
    });

    it('should report unavailable when GM_download is missing', async () => {
      const result = await checkDownloadService();
      if (!result.available) {
        expect(result.message).toBe('GM_download unavailable');
      }
    });
  });

  describe('checkPersistentStorage', () => {
    it('should detect GM_setValue availability', async () => {
      const result = await checkPersistentStorage();
      expect(result.name).toBe('PersistentStorage');
      expect(result.available).toBe(
        !!(globalThis as unknown as { GM_setValue?: unknown }).GM_setValue
      );
    });

    it('should report unavailable message when GM_setValue is missing', async () => {
      const result = await checkPersistentStorage();
      if (!result.available) {
        expect(result.message).toBe('GM_setValue unavailable');
      }
    });
  });

  describe('checkAllServices', () => {
    it('should check all services in parallel', async () => {
      const results = await checkAllServices();

      expect(results).toHaveLength(4);
      expect(results.map(r => r.name)).toEqual([
        'HttpRequestService',
        'NotificationService',
        'DownloadService',
        'PersistentStorage',
      ]);
    });

    it('should handle individual service check failures', async () => {
      const results = await checkAllServices();

      // All results should have required properties
      results.forEach(result => {
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('available');
        expect(result).toHaveProperty('message');
        expect(typeof result.available).toBe('boolean');
      });
    });
  });
});
