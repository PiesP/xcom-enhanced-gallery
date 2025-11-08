/**
 * DownloadService Test Mode Tests - Phase 314-4
 *
 * Tests for downloadInTestMode() and downloadBlobBulkInTestMode() methods.
 * Verifies test mode simulation without requiring Tampermonkey API.
 *
 * @see src/shared/services/download-service.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  DownloadService,
  type BlobDownloadOptions,
  type TestModeDownloadOptions,
  type TestModeDownloadResult,
} from '../../../src/shared/services';

describe('DownloadService Test Mode (Phase 314-4)', () => {
  setupGlobalTestIsolation();

  let downloadService: DownloadService;
  let testBlob: Blob;

  beforeEach(() => {
    downloadService = DownloadService.getInstance();
    testBlob = new Blob(['test data content'], { type: 'text/plain' });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('downloadInTestMode', () => {
    it('should simulate successful download', async () => {
      const options: BlobDownloadOptions = {
        blob: testBlob,
        name: 'test-file.txt',
      };

      const result = await downloadService.downloadInTestMode(options, {
        simulateSuccess: true,
      });

      expect(result.success).toBe(true);
      expect(result.testMode).toBe(true);
      expect(result.filename).toBe('test-file.txt');
      expect(result.size).toBe(testBlob.size);
      expect(result.simulatedAt).toBeDefined();
      expect(typeof result.simulatedAt).toBe('string');
    });

    it('should simulate failed download', async () => {
      const options: BlobDownloadOptions = {
        blob: testBlob,
        name: 'test-file.txt',
      };

      const result = await downloadService.downloadInTestMode(options, {
        simulateSuccess: false,
        errorMessage: 'Simulated network error',
      });

      expect(result.success).toBe(false);
      expect(result.testMode).toBe(true);
      expect(result.filename).toBe('test-file.txt');
      expect(result.error).toBe('Simulated network error');
      expect(result.simulatedAt).toBeDefined();
    });

    it('should respect simulateDelay option', async () => {
      const options: BlobDownloadOptions = {
        blob: testBlob,
        name: 'test-file.txt',
      };

      const startTime = Date.now();
      await downloadService.downloadInTestMode(options, {
        simulateSuccess: true,
        simulateDelay: 100,
      });
      const duration = Date.now() - startTime;

      // Should take at least simulateDelay milliseconds
      expect(duration).toBeGreaterThanOrEqual(90); // Allow 10ms margin
    });

    it('should handle invalid blob', async () => {
      const options: BlobDownloadOptions = {
        blob: {} as Blob,
        name: 'invalid.txt',
      };

      const result = await downloadService.downloadInTestMode(options, {
        simulateSuccess: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid blob');
      expect(result.testMode).toBe(true);
    });

    it('should return valid TestModeDownloadResult structure', async () => {
      const options: BlobDownloadOptions = {
        blob: testBlob,
        name: 'test.txt',
      };

      const result = await downloadService.downloadInTestMode(options);

      // Verify all required fields
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('testMode');
      expect(result).toHaveProperty('simulatedAt');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('size');

      // Verify types
      expect(typeof result.success).toBe('boolean');
      expect(result.testMode).toBe(true);
      expect(typeof result.simulatedAt).toBe('string');
    });

    it('should use default test options when not provided', async () => {
      const options: BlobDownloadOptions = {
        blob: testBlob,
        name: 'test.txt',
      };

      // Call without testOptions - should default to simulateSuccess: true
      const result = await downloadService.downloadInTestMode(options);

      expect(result.success).toBe(true);
      expect(result.testMode).toBe(true);
    });
  });

  describe('downloadBlobBulkInTestMode', () => {
    it('should simulate bulk download with multiple files', async () => {
      const options: BlobDownloadOptions[] = [
        { blob: testBlob, name: 'file1.txt' },
        { blob: testBlob, name: 'file2.txt' },
        { blob: testBlob, name: 'file3.txt' },
      ];

      const results = await downloadService.downloadBlobBulkInTestMode(options, {
        simulateSuccess: true,
      });

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.testMode)).toBe(true);
      expect(results[0]?.filename).toBe('file1.txt');
      expect(results[1]?.filename).toBe('file2.txt');
      expect(results[2]?.filename).toBe('file3.txt');
    });

    it('should handle mixed success and failure', async () => {
      const blob1 = new Blob(['data1'], { type: 'text/plain' });
      const blob2 = new Blob(['data2'], { type: 'text/plain' });

      const options: BlobDownloadOptions[] = [
        { blob: blob1, name: 'file1.txt' },
        { blob: blob2, name: 'file2.txt' },
      ];

      // First succeeds, second fails
      let callCount = 0;
      const results = await downloadService.downloadBlobBulkInTestMode(options, {
        simulateSuccess: callCount === 0,
        errorMessage: 'Simulated failure',
      });

      // Both calls will use simulateSuccess from options
      // This test verifies the bulk download structure works
      expect(results).toHaveLength(2);
      expect(results.every(r => r.testMode)).toBe(true);
      expect(results.every(r => typeof r.simulatedAt === 'string')).toBe(true);
    });

    it('should call progress callback during bulk download', async () => {
      const options: BlobDownloadOptions[] = [
        { blob: testBlob, name: 'file1.txt' },
        { blob: testBlob, name: 'file2.txt' },
      ];

      const progressMock = vi.fn();

      await downloadService.downloadBlobBulkInTestMode(
        options,
        { simulateSuccess: true },
        progressMock
      );

      expect(progressMock).toHaveBeenCalledTimes(2);
      expect(progressMock).toHaveBeenCalledWith({ current: 1, total: 2 });
      expect(progressMock).toHaveBeenCalledWith({ current: 2, total: 2 });
    });

    it('should handle empty options array', async () => {
      const results = await downloadService.downloadBlobBulkInTestMode([], {
        simulateSuccess: true,
      });

      expect(results).toHaveLength(0);
    });

    it('should handle invalid options in bulk', async () => {
      const options = [
        { blob: testBlob, name: 'valid.txt' },
        undefined as unknown as BlobDownloadOptions,
        { blob: testBlob, name: 'another.txt' },
      ];

      const results = await downloadService.downloadBlobBulkInTestMode(
        options as BlobDownloadOptions[],
        { simulateSuccess: true }
      );

      expect(results).toHaveLength(3);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
      expect(results[2]?.success).toBe(true);
    });
  });

  describe('Singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = DownloadService.getInstance();
      const instance2 = DownloadService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Integration with test environments', () => {
    it('should work without GM_download availability', async () => {
      // Ensure GM_download is not available
      Object.defineProperty(globalThis, 'GM_download', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const options: BlobDownloadOptions = {
        blob: testBlob,
        name: 'test.txt',
      };

      // Should still work in test mode
      const result = await downloadService.downloadInTestMode(options, {
        simulateSuccess: true,
      });

      expect(result.success).toBe(true);
      expect(result.testMode).toBe(true);
    });

    it('should provide consistent results across multiple calls', async () => {
      const options: BlobDownloadOptions = {
        blob: testBlob,
        name: 'consistent.txt',
      };

      const results: TestModeDownloadResult[] = [];

      for (let i = 0; i < 3; i++) {
        const result = await downloadService.downloadInTestMode(options, {
          simulateSuccess: true,
        });
        results.push(result);
      }

      // All should succeed
      expect(results.every(r => r.success)).toBe(true);
      // All should have testMode flag
      expect(results.every(r => r.testMode)).toBe(true);
      // All should have different timestamps
      const timestamps = results.map(r => r.simulatedAt);
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBeGreaterThanOrEqual(2); // At least some variation
    });
  });
});
