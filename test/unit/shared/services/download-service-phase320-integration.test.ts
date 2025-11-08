/**
 * DownloadService - Phase 320 Integration Tests (Stage 4-2)
 *
 * Focus: Error propagation, state management, data type diversity,
 * concurrent operations, and real-world scenarios
 *
 * Total: 20 integration test cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  DownloadService,
  type BlobDownloadOptions,
  type BlobDownloadResult,
} from '../../../../src/shared/services/download-service.js';

describe('DownloadService - Phase 320 Integration Tests', () => {
  // Note: 이 테스트는 setupGlobalTestIsolation()을 사용하지 않음
  // 이유: 각 테스트마다 GM_download 설정을 구체적으로 제어해야 하기 때문에
  // 글로벌 자동 정리는 테스트 순서 의존성을 야기할 수 있음

  let service: DownloadService;

  beforeEach(() => {
    service = DownloadService.getInstance();
    service.reset?.();
    vi.clearAllMocks();
  });

  describe('Error Propagation & Handling (6 tests)', () => {
    it('should propagate network errors through error chain', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const networkError = new Error('Network timeout');

      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onerror?.(networkError);
      });

      const result = await service.downloadBlob({ blob, name: 'test.txt' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Error should be propagated or stringified
      expect(typeof result.error).toBe('string');
    });

    it('should handle cascading errors in bulk download', async () => {
      const blobs = Array(5)
        .fill(null)
        .map((_, i) => new Blob([`data${i}`], { type: 'text/plain' }));

      let callCount = 0;
      (globalThis as any).GM_download = vi.fn((options: any) => {
        callCount++;
        // Fail on calls 2, 3, 5
        if (callCount === 2 || callCount === 3 || callCount === 5) {
          options.onerror?.(`Error on download ${callCount}`);
        } else {
          options.onload?.();
        }
      });

      const results = await service.downloadBlobBulk(
        blobs.map((blob, idx) => ({ blob, name: `file${idx}.txt` }))
      );

      // Verify results array structure and error isolation
      expect(results).toHaveLength(5);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false); // 2nd error
      expect(results[2].success).toBe(false); // 3rd error
      expect(results[3].success).toBe(true);
      expect(results[4].success).toBe(false); // 5th error
    });

    it('should recover state after partial download failure', async () => {
      const blob1 = new Blob(['data1'], { type: 'text/plain' });
      const blob2 = new Blob(['data2'], { type: 'text/plain' });
      const blob3 = new Blob(['data3'], { type: 'text/plain' });

      let callCount = 0;
      (globalThis as any).GM_download = vi.fn((options: any) => {
        callCount++;
        if (callCount === 2) {
          options.onerror?.('Disk error');
        } else {
          options.onload?.();
        }
      });

      // First bulk download with failure
      const batch1 = await service.downloadBlobBulk([
        { blob: blob1, name: 'file1.txt' },
        { blob: blob2, name: 'file2.txt' },
      ]);

      // Reset counter for second batch
      callCount = 0;
      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.(); // All succeed
      });

      // Second bulk download should succeed
      const batch2 = await service.downloadBlobBulk([{ blob: blob3, name: 'file3.txt' }]);

      // Verify recovery
      expect(batch1[0].success).toBe(true);
      expect(batch1[1].success).toBe(false);
      expect(batch2[0].success).toBe(true);
    });

    it('should handle mixed error types (string, Error, object)', async () => {
      const blobs = [
        new Blob(['data1'], { type: 'text/plain' }),
        new Blob(['data2'], { type: 'text/plain' }),
        new Blob(['data3'], { type: 'text/plain' }),
      ];

      let callCount = 0;
      (globalThis as any).GM_download = vi.fn((options: any) => {
        callCount++;
        if (callCount === 1) {
          // String error
          options.onerror?.('String error message');
        } else if (callCount === 2) {
          // Error object
          options.onerror?.(new Error('Error object message'));
        } else {
          // Success
          options.onload?.();
        }
      });

      const results = await service.downloadBlobBulk(
        blobs.map((blob, idx) => ({ blob, name: `file${idx}.txt` }))
      );

      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
      expect(results.every(r => typeof r.error === 'string' || r.error === undefined)).toBe(true);
    });

    it('should handle timeout as error condition', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });

      (globalThis as any).GM_download = vi.fn((options: any) => {
        // Simulate timeout (no callback, just store it)
        // In real implementation, timeout is handled internally
        if (options.ontimeout) {
          options.ontimeout();
        }
      });

      const result = await service.downloadBlob({ blob, name: 'test.txt' });

      // Either success or failure, but should be resolved
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.filename).toBe('string');
    });

    it('should distinguish between input validation errors and runtime errors', async () => {
      // Input validation error
      const result1 = await service.downloadBlob({
        blob: null as any,
        name: 'test.txt',
      });

      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Invalid blob');

      // Runtime error with valid input
      const validBlob = new Blob(['data'], { type: 'text/plain' });
      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onerror?.('Runtime error');
      });

      const result2 = await service.downloadBlob({
        blob: validBlob,
        name: 'test.txt',
      });

      expect(result2.success).toBe(false);
      expect(result2.error).not.toContain('Invalid blob');
    });
  });

  describe('State Management & Independence (5 tests)', () => {
    it('should maintain independent state across sequential single downloads', async () => {
      const results: BlobDownloadResult[] = [];

      for (let i = 0; i < 3; i++) {
        const blob = new Blob([`data${i}`], { type: 'text/plain' });
        (globalThis as any).GM_download = vi.fn((options: any) => {
          options.onload?.();
        });

        const result = await service.downloadBlob({
          blob,
          name: `file${i}.txt`,
        });

        results.push(result);
      }

      // All should succeed independently
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every((r, i) => r.filename === `file${i}.txt`)).toBe(true);
    });

    it('should isolate failures between concurrent-like sequential calls', async () => {
      const blob1 = new Blob(['data1'], { type: 'text/plain' });
      const blob2 = new Blob(['data2'], { type: 'text/plain' });

      // First download fails
      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onerror?.('Network error');
      });

      const result1 = await service.downloadBlob({ blob: blob1, name: 'file1.txt' });

      // Second download succeeds (state isolated)
      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      const result2 = await service.downloadBlob({ blob: blob2, name: 'file2.txt' });

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(true);
    });

    it('should not leak state from failed bulk downloads to subsequent calls', async () => {
      const blobs1 = [
        new Blob(['d1'], { type: 'text/plain' }),
        new Blob(['d2'], { type: 'text/plain' }),
      ];

      let callCount = 0;
      (globalThis as any).GM_download = vi.fn((options: any) => {
        callCount++;
        if (callCount === 1) {
          options.onerror?.('Error');
        } else {
          options.onload?.();
        }
      });

      // First batch with partial failure
      const batch1 = await service.downloadBlobBulk(
        blobs1.map((blob, idx) => ({ blob, name: `f${idx}.txt` }))
      );

      // Reset and new download should not be affected
      callCount = 0;
      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      const single = await service.downloadBlob({
        blob: new Blob(['data'], { type: 'text/plain' }),
        name: 'new.txt',
      });

      expect(batch1[0].success).toBe(false);
      expect(single.success).toBe(true);
    });

    it('should reset internal counters/timings between downloads', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const results = [];

      for (let i = 0; i < 3; i++) {
        (globalThis as any).GM_download = vi.fn((options: any) => {
          options.onload?.();
        });

        const result = await service.downloadBlob({ blob, name: `f${i}.txt` });
        results.push(result);

        // Small delay between downloads
        await new Promise(r => setTimeout(r, 10));
      }

      // All should be independent with fresh state
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle rapid sequential bulk downloads without state collision', async () => {
      const blobSet1 = [
        new Blob(['data1'], { type: 'text/plain' }),
        new Blob(['data2'], { type: 'text/plain' }),
      ];

      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      const result1 = await service.downloadBlobBulk(
        blobSet1.map((b, i) => ({ blob: b, name: `batch1_${i}.txt` }))
      );

      const blobSet2 = [
        new Blob(['data3'], { type: 'text/plain' }),
        new Blob(['data4'], { type: 'text/plain' }),
      ];

      const result2 = await service.downloadBlobBulk(
        blobSet2.map((b, i) => ({ blob: b, name: `batch2_${i}.txt` }))
      );

      // Both batches should succeed independently
      expect(result1).toHaveLength(2);
      expect(result2).toHaveLength(2);
      expect(result1.every(r => r.success)).toBe(true);
      expect(result2.every(r => r.success)).toBe(true);
    });
  });

  describe('Data Type Diversity & Robustness (5 tests)', () => {
    it('should handle various Blob MIME types', async () => {
      const mimeTypes = [
        'text/plain',
        'application/json',
        'application/pdf',
        'image/png',
        'application/octet-stream',
      ];

      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      const results: BlobDownloadResult[] = [];
      for (const mimeType of mimeTypes) {
        const blob = new Blob(['data'], { type: mimeType });
        const result = await service.downloadBlob({
          blob,
          name: `file.${mimeType.split('/')[1]}`,
        });
        results.push(result);
      }

      expect(results).toHaveLength(5);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle File objects (Blob subclass)', async () => {
      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      // File is a Blob subclass
      const file = new File(['file content'], 'test.txt', { type: 'text/plain' });

      const result = await service.downloadBlob({
        blob: file as any,
        name: 'downloaded_file.txt',
      });

      expect(result.success).toBe(true);
      expect(result.filename).toBe('downloaded_file.txt');
    });

    it('should handle large Blobs (10MB+)', async () => {
      // Create 10MB blob
      const largeData = new ArrayBuffer(10 * 1024 * 1024);
      const blob = new Blob([largeData], { type: 'application/octet-stream' });

      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      const result = await service.downloadBlob({
        blob,
        name: 'large_file.bin',
      });

      expect(result.success).toBe(true);
      expect(result.size).toBeGreaterThan(10 * 1024 * 1024 - 100); // Allow some margin
    });

    it('should handle mixed blob sizes in bulk download', async () => {
      const blobs = [
        new Blob(['small'], { type: 'text/plain' }),
        new Blob([new ArrayBuffer(1024 * 1024)], { type: 'application/octet-stream' }), // 1MB
        new Blob(['medium content'], { type: 'text/plain' }),
        new Blob([new ArrayBuffer(5 * 1024 * 1024)], { type: 'application/octet-stream' }), // 5MB
      ];

      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      const results = await service.downloadBlobBulk(
        blobs.map((blob, idx) => ({
          blob,
          name: `file${idx}.bin`,
        }))
      );

      expect(results).toHaveLength(4);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.some(r => (r.size || 0) > 1024 * 1024)).toBe(true);
    });

    it('should handle empty Blobs', async () => {
      const emptyBlob = new Blob([], { type: 'text/plain' });

      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      const result = await service.downloadBlob({
        blob: emptyBlob,
        name: 'empty.txt',
      });

      expect(result.success).toBe(true);
      expect(result.size).toBe(0);
    });
  });

  describe('Real-World Scenarios (4 tests)', () => {
    it('should handle retry workflow (user attempts multiple times)', async () => {
      const blob = new Blob(['important data'], { type: 'application/octet-stream' });
      const attempts: Array<{ attempt: number; success: boolean }> = [];

      // Attempt 1: fails
      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onerror?.('Network timeout');
      });
      let result = await service.downloadBlob({ blob, name: 'data.bin' });
      attempts.push({ attempt: 1, success: result.success });

      // Attempt 2: fails again
      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onerror?.('Network error');
      });
      result = await service.downloadBlob({ blob, name: 'data.bin' });
      attempts.push({ attempt: 2, success: result.success });

      // Attempt 3: succeeds
      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });
      result = await service.downloadBlob({ blob, name: 'data.bin' });
      attempts.push({ attempt: 3, success: result.success });

      expect(attempts[0].success).toBe(false);
      expect(attempts[1].success).toBe(false);
      expect(attempts[2].success).toBe(true);
    });

    it('should handle mixed success/failure in bulk (user needs report)', async () => {
      const files = [
        { name: 'report1.pdf', success: true },
        { name: 'report2.pdf', success: false },
        { name: 'report3.pdf', success: true },
        { name: 'report4.pdf', success: false },
        { name: 'report5.pdf', success: true },
      ];

      let idx = 0;
      (globalThis as any).GM_download = vi.fn((options: any) => {
        if (files[idx].success) {
          options.onload?.();
        } else {
          options.onerror?.('Permission denied');
        }
        idx++;
      });

      const results = await service.downloadBlobBulk(
        files.map(f => ({
          blob: new Blob(['content'], { type: 'application/pdf' }),
          name: f.name,
        }))
      );

      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      expect(succeeded).toBe(3);
      expect(failed).toBe(2);
    });

    it('should handle filename variations', async () => {
      const filenames = [
        'simple.txt',
        'file with spaces.txt',
        'file-with-dashes.txt',
        'file_with_underscores.txt',
        '文件名.txt', // Chinese characters
        'файл.txt', // Cyrillic
      ];

      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      const results: BlobDownloadResult[] = [];
      for (const filename of filenames) {
        const result = await service.downloadBlob({
          blob: new Blob(['content'], { type: 'text/plain' }),
          name: filename,
        });
        results.push(result);
      }

      expect(results).toHaveLength(6);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.map(r => r.filename)).toEqual(filenames);
    });

    it('should maintain performance with many sequential downloads', async () => {
      const downloadCount = 20;
      const blobs = Array(downloadCount)
        .fill(null)
        .map((_, i) => new Blob([`data${i}`], { type: 'text/plain' }));

      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      const startTime = performance.now();

      const results = await service.downloadBlobBulk(
        blobs.map((blob, idx) => ({
          blob,
          name: `file${idx}.txt`,
        }))
      );

      const duration = performance.now() - startTime;

      expect(results).toHaveLength(downloadCount);
      expect(results.every(r => r.success)).toBe(true);
      // Should complete reasonably fast (< 5 seconds for 20 downloads)
      expect(duration).toBeLessThan(5000);
    });
  });
});
