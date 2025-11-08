/**
 * DownloadService Unit Tests
 *
 * Tests for Phase 309 Tampermonkey Service Layer
 * Coverage target: 80%+
 *
 * Test categories:
 * 1. Singleton pattern
 * 2. Blob download (downloadBlob)
 * 3. Bulk blob download (downloadBlobBulk)
 * 4. Test mode (downloadInTestMode, downloadBlobBulkInTestMode)
 * 5. Error handling
 * 6. GM_download integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DownloadService } from '../../../../src/shared/services/download-service';
import type {
  BlobDownloadOptions,
  BlobDownloadResult,
  TestModeDownloadOptions,
  TestModeDownloadResult,
} from '../../../../src/shared/services/download-service';

// Mock dependencies
vi.mock('@shared/services/notification-service', () => ({
  NotificationService: {
    getInstance: vi.fn(() => ({
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    })),
  },
}));

vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@shared/utils/timer-management', () => ({
  globalTimerManager: {
    setTimeout: vi.fn((fn: () => void, delay: number) => {
      return global.setTimeout(fn, delay);
    }),
    clearTimeout: vi.fn((id: number) => {
      global.clearTimeout(id);
    }),
  },
}));

describe('DownloadService', () => {
  let service: DownloadService;
  let mockGMDownload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset singleton using type assertion
    // @ts-expect-error - Accessing private static property for test reset
    DownloadService.instance = null;
    service = DownloadService.getInstance();

    // Mock GM_download
    mockGMDownload = vi.fn();
    (globalThis as { GM_download?: typeof mockGMDownload }).GM_download = mockGMDownload;

    // Clear all timers
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (globalThis as { GM_download?: typeof mockGMDownload }).GM_download;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DownloadService.getInstance();
      const instance2 = DownloadService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create instance on first call', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DownloadService);
    });
  });

  describe('downloadBlob', () => {
    it('should successfully download a blob', async () => {
      const blob = new Blob(['test data'], { type: 'text/plain' });
      const options: BlobDownloadOptions = {
        blob,
        name: 'test.txt',
        saveAs: true,
        conflictAction: 'uniquify',
      };

      // Simulate successful GM_download
      mockGMDownload.mockImplementation(
        (gmOptions: {
          onload?: () => void;
          onerror?: (error: Error) => void;
          ontimeout?: () => void;
        }) => {
          setTimeout(() => gmOptions.onload?.(), 0);
        }
      );

      const result = await service.downloadBlob(options);

      expect(result.success).toBe(true);
      expect(result.filename).toBe('test.txt');
      expect(result.size).toBe(blob.size);
      expect(mockGMDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          blob,
          name: 'test.txt',
          saveAs: true,
          conflictAction: 'uniquify',
        })
      );
    });

    it('should handle GM_download not available', async () => {
      delete (globalThis as { GM_download?: typeof mockGMDownload }).GM_download;

      const blob = new Blob(['test'], { type: 'text/plain' });
      const result = await service.downloadBlob({ blob, name: 'test.txt' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('GM_download not available in this environment');
    });

    it('should handle invalid blob', async () => {
      const result = await service.downloadBlob({
        blob: null as unknown as Blob,
        name: 'test.txt',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid blob provided');
    });

    it('should handle download error', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const errorMsg = 'Network error';

      mockGMDownload.mockImplementation(
        (gmOptions: {
          onload?: () => void;
          onerror?: (error: Error | string) => void;
          ontimeout?: () => void;
        }) => {
          setTimeout(() => gmOptions.onerror?.(new Error(errorMsg)), 0);
        }
      );

      const result = await service.downloadBlob({ blob, name: 'test.txt' });

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMsg);
      expect(result.filename).toBe('test.txt');
    });

    it('should handle download timeout', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });

      mockGMDownload.mockImplementation(
        (gmOptions: {
          onload?: () => void;
          onerror?: (error: Error) => void;
          ontimeout?: () => void;
        }) => {
          setTimeout(() => gmOptions.ontimeout?.(), 0);
        }
      );

      const result = await service.downloadBlob({ blob, name: 'test.txt' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Download timeout');
    });

    it('should handle GM_download exception', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      mockGMDownload.mockImplementation(() => {
        throw new Error('GM_download crashed');
      });

      const result = await service.downloadBlob({ blob, name: 'test.txt' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('GM_download crashed');
    });

    it('should use default options', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      mockGMDownload.mockImplementation(
        (gmOptions: {
          onload?: () => void;
          onerror?: (error: Error) => void;
          ontimeout?: () => void;
        }) => {
          setTimeout(() => gmOptions.onload?.(), 0);
        }
      );

      await service.downloadBlob({ blob, name: 'test.txt' });

      expect(mockGMDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          saveAs: false,
          conflictAction: 'uniquify',
        })
      );
    });

    it('should include blob size in result', async () => {
      const blob = new Blob(['test data with size'], { type: 'text/plain' });
      mockGMDownload.mockImplementation(
        (gmOptions: {
          onload?: () => void;
          onerror?: (error: Error) => void;
          ontimeout?: () => void;
        }) => {
          setTimeout(() => gmOptions.onload?.(), 0);
        }
      );

      const result = await service.downloadBlob({ blob, name: 'test.txt' });

      expect(result.size).toBe(blob.size);
    });
  });

  describe('downloadBlobBulk', () => {
    it('should download multiple blobs sequentially', async () => {
      const blobs = [
        new Blob(['data1'], { type: 'text/plain' }),
        new Blob(['data2'], { type: 'text/plain' }),
        new Blob(['data3'], { type: 'text/plain' }),
      ];

      const options: BlobDownloadOptions[] = blobs.map((blob, i) => ({
        blob,
        name: `file-${i}.txt`,
      }));

      mockGMDownload.mockImplementation(
        (gmOptions: {
          onload?: () => void;
          onerror?: (error: Error) => void;
          ontimeout?: () => void;
        }) => {
          setTimeout(() => gmOptions.onload?.(), 0);
        }
      );

      const results = await service.downloadBlobBulk(options);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockGMDownload).toHaveBeenCalledTimes(3);
    });

    it('should report progress during bulk download', async () => {
      const blobs = [
        new Blob(['data1'], { type: 'text/plain' }),
        new Blob(['data2'], { type: 'text/plain' }),
      ];

      const options: BlobDownloadOptions[] = blobs.map((blob, i) => ({
        blob,
        name: `file-${i}.txt`,
      }));

      mockGMDownload.mockImplementation(
        (gmOptions: {
          onload?: () => void;
          onerror?: (error: Error) => void;
          ontimeout?: () => void;
        }) => {
          setTimeout(() => gmOptions.onload?.(), 0);
        }
      );

      const progressUpdates: Array<{ current: number; total: number }> = [];
      const onProgress = (progress: { current: number; total: number }) => {
        progressUpdates.push(progress);
      };

      await service.downloadBlobBulk(options, onProgress);

      expect(progressUpdates).toHaveLength(2);
      expect(progressUpdates[0]).toEqual({ current: 1, total: 2 });
      expect(progressUpdates[1]).toEqual({ current: 2, total: 2 });
    });

    it('should handle partial failures', async () => {
      const blobs = [
        new Blob(['data1'], { type: 'text/plain' }),
        new Blob(['data2'], { type: 'text/plain' }),
        new Blob(['data3'], { type: 'text/plain' }),
      ];

      const options: BlobDownloadOptions[] = blobs.map((blob, i) => ({
        blob,
        name: `file-${i}.txt`,
      }));

      let callCount = 0;
      mockGMDownload.mockImplementation(
        (gmOptions: {
          onload?: () => void;
          onerror?: (error: Error) => void;
          ontimeout?: () => void;
        }) => {
          callCount++;
          if (callCount === 2) {
            setTimeout(() => gmOptions.onerror?.(new Error('Failed')), 0);
          } else {
            setTimeout(() => gmOptions.onload?.(), 0);
          }
        }
      );

      const results = await service.downloadBlobBulk(options);

      expect(results).toHaveLength(3);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
      expect(results[2]?.success).toBe(true);
    });

    it('should skip invalid options', async () => {
      const options: BlobDownloadOptions[] = [
        { blob: new Blob(['data1'], { type: 'text/plain' }), name: 'file-1.txt' },
        undefined as unknown as BlobDownloadOptions,
        { blob: new Blob(['data3'], { type: 'text/plain' }), name: 'file-3.txt' },
      ];

      mockGMDownload.mockImplementation(
        (gmOptions: {
          onload?: () => void;
          onerror?: (error: Error) => void;
          ontimeout?: () => void;
        }) => {
          setTimeout(() => gmOptions.onload?.(), 0);
        }
      );

      const results = await service.downloadBlobBulk(options);

      expect(results).toHaveLength(3);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
      expect(results[1]?.error).toBe('Invalid option');
      expect(results[2]?.success).toBe(true);
    });
  });

  describe('downloadInTestMode', () => {
    it('should simulate successful download', async () => {
      const blob = new Blob(['test data'], { type: 'text/plain' });
      const options: BlobDownloadOptions = { blob, name: 'test.txt' };
      const testOptions: TestModeDownloadOptions = {
        simulateSuccess: true,
        simulateDelay: 10,
      };

      const result = await service.downloadInTestMode(options, testOptions);

      expect(result.testMode).toBe(true);
      expect(result.success).toBe(true);
      expect(result.filename).toBe('test.txt');
      expect(result.size).toBe(blob.size);
      expect(result.simulatedAt).toBeDefined();
    });

    it('should simulate failed download', async () => {
      const blob = new Blob(['test data'], { type: 'text/plain' });
      const options: BlobDownloadOptions = { blob, name: 'test.txt' };
      const testOptions: TestModeDownloadOptions = {
        simulateSuccess: false,
        simulateDelay: 10,
        errorMessage: 'Custom error',
      };

      const result = await service.downloadInTestMode(options, testOptions);

      expect(result.testMode).toBe(true);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Custom error');
      expect(result.simulatedAt).toBeDefined();
    });

    it('should handle invalid blob in test mode', async () => {
      const options: BlobDownloadOptions = {
        blob: null as unknown as Blob,
        name: 'test.txt',
      };

      const result = await service.downloadInTestMode(options);

      expect(result.testMode).toBe(true);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid blob provided');
    });

    it('should use default test options', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const result = await service.downloadInTestMode({ blob, name: 'test.txt' });

      expect(result.testMode).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should respect simulateDelay', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const startTime = Date.now();

      await service.downloadInTestMode({ blob, name: 'test.txt' }, { simulateDelay: 100 });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow 10ms tolerance
    });

    it('should handle exceptions in test mode', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      vi.spyOn(blob, 'size', 'get').mockImplementation(() => {
        throw new Error('Size getter error');
      });

      const result = await service.downloadInTestMode({ blob, name: 'test.txt' });

      expect(result.testMode).toBe(true);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Size getter error');
    });
  });

  describe('downloadBlobBulkInTestMode', () => {
    it('should simulate bulk download', async () => {
      const blobs = [
        new Blob(['data1'], { type: 'text/plain' }),
        new Blob(['data2'], { type: 'text/plain' }),
      ];

      const options: BlobDownloadOptions[] = blobs.map((blob, i) => ({
        blob,
        name: `file-${i}.txt`,
      }));

      const results = await service.downloadBlobBulkInTestMode(options, {
        simulateSuccess: true,
        simulateDelay: 10,
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.testMode)).toBe(true);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should report progress in test mode', async () => {
      const blobs = [
        new Blob(['data1'], { type: 'text/plain' }),
        new Blob(['data2'], { type: 'text/plain' }),
      ];

      const options: BlobDownloadOptions[] = blobs.map((blob, i) => ({
        blob,
        name: `file-${i}.txt`,
      }));

      const progressUpdates: Array<{ current: number; total: number }> = [];
      const onProgress = (progress: { current: number; total: number }) => {
        progressUpdates.push(progress);
      };

      await service.downloadBlobBulkInTestMode(options, { simulateSuccess: true }, onProgress);

      expect(progressUpdates).toHaveLength(2);
      expect(progressUpdates[0]).toEqual({ current: 1, total: 2 });
      expect(progressUpdates[1]).toEqual({ current: 2, total: 2 });
    });

    it('should handle invalid options in test mode', async () => {
      const options: BlobDownloadOptions[] = [
        { blob: new Blob(['data1'], { type: 'text/plain' }), name: 'file-1.txt' },
        undefined as unknown as BlobDownloadOptions,
      ];

      const results = await service.downloadBlobBulkInTestMode(options);

      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
      expect(results[1]?.error).toBe('Invalid option');
    });
  });

  describe('reset', () => {
    it('should reset service without errors', () => {
      expect(() => service.reset()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle File object (subclass of Blob)', async () => {
      const file = new File(['file content'], 'test-file.txt', { type: 'text/plain' });
      mockGMDownload.mockImplementation(
        (gmOptions: {
          onload?: () => void;
          onerror?: (error: Error) => void;
          ontimeout?: () => void;
        }) => {
          setTimeout(() => gmOptions.onload?.(), 0);
        }
      );

      const result = await service.downloadBlob({ blob: file, name: 'test.txt' });

      expect(result.success).toBe(true);
      expect(result.filename).toBe('test.txt');
    });

    it('should handle empty blob', async () => {
      const blob = new Blob([], { type: 'text/plain' });
      mockGMDownload.mockImplementation(
        (gmOptions: {
          onload?: () => void;
          onerror?: (error: Error) => void;
          ontimeout?: () => void;
        }) => {
          setTimeout(() => gmOptions.onload?.(), 0);
        }
      );

      const result = await service.downloadBlob({ blob, name: 'empty.txt' });

      expect(result.success).toBe(true);
      expect(result.size).toBe(0);
    });

    it('should handle error object with error property', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      mockGMDownload.mockImplementation(
        (gmOptions: {
          onload?: () => void;
          onerror?: (error: { error: string }) => void;
          ontimeout?: () => void;
        }) => {
          setTimeout(() => gmOptions.onerror?.({ error: 'Custom error object' }), 0);
        }
      );

      const result = await service.downloadBlob({ blob, name: 'test.txt' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Custom error object');
    });

    it('should handle null/undefined error', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      mockGMDownload.mockImplementation(
        (gmOptions: {
          onload?: () => void;
          onerror?: (error: null) => void;
          ontimeout?: () => void;
        }) => {
          setTimeout(() => gmOptions.onerror?.(null), 0);
        }
      );

      const result = await service.downloadBlob({ blob, name: 'test.txt' });

      expect(result.success).toBe(false);
      // String(null) returns 'null', not 'Unknown error'
      expect(result.error).toBe('null');
    });
  });
});
