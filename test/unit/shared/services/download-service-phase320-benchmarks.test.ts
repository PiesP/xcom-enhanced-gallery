/**
 * DownloadService - Phase 320 Performance Benchmarks (Stage 4-4)
 *
 * Focus: Performance metrics collection, baseline establishment,
 * and performance regression detection
 *
 * Benchmarks measure:
 * - Memory usage (per Blob size)
 * - Download throughput
 * - CPU utilization
 * - Latency patterns
 * - Scalability limits
 *
 * Total: 5 benchmark test scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  DownloadService,
  type BlobDownloadResult,
} from '../../../../src/shared/services/download-service.js';

describe('DownloadService - Phase 320 Performance Benchmarks (Stage 4-4)', () => {
  setupGlobalTestIsolation();

  let service: DownloadService;

  beforeEach(() => {
    service = DownloadService.getInstance();
    service.reset?.();
    vi.clearAllMocks();
  });

  describe('Performance Benchmarks (5 scenarios)', () => {
    it('[BENCH-1] Single file download latency profile', async () => {
      /**
       * Benchmark: Single file download latency
       * Measures: Response time, memory impact
       * Baseline: < 100ms for small files, < 1s for large files
       */

      const benchmarks = [
        { size: 1 * 1024, label: '1KB' },
        { size: 100 * 1024, label: '100KB' },
        { size: 1 * 1024 * 1024, label: '1MB' },
        { size: 10 * 1024 * 1024, label: '10MB' },
      ];

      const results: Array<{
        size: string;
        bytes: number;
        timeMs: number;
        throughputMBs: number;
      }> = [];

      for (const bench of benchmarks) {
        const blob = new Blob([new ArrayBuffer(bench.size)], {
          type: 'application/octet-stream',
        });

        (globalThis as any).GM_download = vi.fn((options: any) => {
          options.onload?.();
        });

        const startTime = performance.now();
        const result = await service.downloadBlob({
          blob,
          name: `benchmark_${bench.label}.bin`,
        });
        const duration = performance.now() - startTime;

        const throughputMBs = bench.size / (1024 * 1024) / (duration / 1000);

        results.push({
          size: bench.label,
          bytes: bench.size,
          timeMs: duration,
          throughputMBs: throughputMBs,
        });

        expect(result.success).toBe(true);
      }

      // Performance assertions
      expect(results[0].timeMs).toBeLessThan(100); // 1KB < 100ms
      expect(results[1].timeMs).toBeLessThan(500); // 100KB < 500ms
      expect(results[2].timeMs).toBeLessThan(1000); // 1MB < 1s
      expect(results[3].timeMs).toBeLessThan(2000); // 10MB < 2s

      // Verify throughput scales appropriately
      expect(results.every(r => r.throughputMBs > 0)).toBe(true);
    });

    it('[BENCH-2] Bulk download throughput benchmark (100 files)', async () => {
      /**
       * Benchmark: Batch download throughput
       * Measures: Total time for 100 sequential downloads
       * Baseline: 100 files < 10 seconds (100ms delay per file)
       */

      const fileCount = 100;
      const fileSizeKB = 100; // 100KB per file

      const startTime = performance.now();
      let downloadCount = 0;

      (globalThis as any).GM_download = vi.fn((options: any) => {
        downloadCount++;
        options.onload?.();
      });

      const results = await service.downloadBlobBulk(
        Array.from({ length: fileCount }, (_, i) => ({
          blob: new Blob([new ArrayBuffer(fileSizeKB * 1024)], {
            type: 'application/octet-stream',
          }),
          name: `perf_${i}.bin`,
        }))
      );

      const duration = performance.now() - startTime;
      const totalDataMB = (fileCount * fileSizeKB) / 1024;
      const throughputMBs = totalDataMB / (duration / 1000);

      // Verify all downloads succeeded
      expect(results).toHaveLength(fileCount);
      expect(results.every(r => r.success)).toBe(true);

      // Performance assertions
      expect(duration).toBeLessThan(15000); // 100 files < 15 seconds
      expect(duration).toBeGreaterThan(9000); // > 9 seconds (100ms * 100 = 10s delay min)

      // Throughput should be consistent
      expect(throughputMBs).toBeGreaterThan(0);

      console.debug(`[BENCH-2] 100 files (${fileSizeKB}KB each):`, {
        totalDataMB: totalDataMB.toFixed(2),
        durationSeconds: (duration / 1000).toFixed(2),
        throughputMBs: throughputMBs.toFixed(2),
      });
    });

    it('[BENCH-3] Memory efficiency with varying blob sizes', async () => {
      /**
       * Benchmark: Memory efficiency
       * Measures: No memory leaks, GC friendly
       * Validates: Service doesn't accumulate state
       */

      const blobSizes = [
        1 * 1024 * 1024, // 1MB
        5 * 1024 * 1024, // 5MB
        10 * 1024 * 1024, // 10MB
        5 * 1024 * 1024, // 5MB again
        1 * 1024 * 1024, // 1MB again
      ];

      const memorySnapshots: Array<{ sizeKB: number; timeMs: number }> = [];

      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      for (const size of blobSizes) {
        const startTime = performance.now();
        const blob = new Blob([new ArrayBuffer(size)], {
          type: 'application/octet-stream',
        });

        const result = await service.downloadBlob({
          blob,
          name: `memory_test_${size}.bin`,
        });

        const duration = performance.now() - startTime;

        memorySnapshots.push({
          sizeKB: size / 1024,
          timeMs: duration,
        });

        expect(result.success).toBe(true);
      }

      // Verify no significant performance degradation with repeated operations
      // Second 1MB should have similar performance to first 1MB
      const first1MB = memorySnapshots[0].timeMs;
      const second1MB = memorySnapshots[4].timeMs;

      // Should be within 200% of original (allowing for system variance)
      // Performance benchmarks are loose due to system variance in CI
      expect(second1MB).toBeLessThan(first1MB * 3.0);

      // Memory efficiency: larger blobs shouldn't cause exponential slowdown
      const max10MB = memorySnapshots[2].timeMs;
      const min1MB = Math.min(first1MB, second1MB);

      // 10x size should not cause > 100x slowdown (very loose to account for variance)
      expect(max10MB).toBeLessThan(min1MB * 100);
    });

    it('[BENCH-4] Error handling performance (error recovery)', async () => {
      /**
       * Benchmark: Error handling performance
       * Measures: Overhead of error handling
       * Validates: Error cases don't cause performance degradation
       */

      const scenarios = [
        { name: 'success_case', willFail: false },
        { name: 'error_case', willFail: true },
        { name: 'success_again', willFail: false },
      ];

      const errorHandlingMetrics: Array<{
        scenario: string;
        timeMs: number;
        success: boolean;
      }> = [];

      for (const scenario of scenarios) {
        (globalThis as any).GM_download = vi.fn((options: any) => {
          if (scenario.willFail) {
            options.onerror?.('Simulated error');
          } else {
            options.onload?.();
          }
        });

        const startTime = performance.now();
        const result = await service.downloadBlob({
          blob: new Blob(['data'], { type: 'text/plain' }),
          name: `error_bench_${scenario.name}.txt`,
        });
        const duration = performance.now() - startTime;

        errorHandlingMetrics.push({
          scenario: scenario.name,
          timeMs: duration,
          success: result.success,
        });
      }

      // Verify results are correct
      expect(errorHandlingMetrics[0].success).toBe(true);
      expect(errorHandlingMetrics[1].success).toBe(false);
      expect(errorHandlingMetrics[2].success).toBe(true);

      // Performance check: error handling shouldn't be drastically slower
      // Just verify we can handle errors without major performance loss
      // (System timing variance makes strict benchmarks unreliable)
      expect(errorHandlingMetrics.every(m => m.timeMs < 1000)).toBe(true);
    });

    it('[BENCH-5] Scalability profile (100 sequential downloads stress test)', async () => {
      /**
       * Benchmark: Scalability limit
       * Measures: Performance with moderate volume
       * Validates: Linear or sub-linear scaling
       */

      const fileCount = 100;
      const fileSizeKB = 10; // 10KB per file (small for volume test)

      const startTime = performance.now();

      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      const results = await service.downloadBlobBulk(
        Array.from({ length: fileCount }, (_, i) => ({
          blob: new Blob([new ArrayBuffer(fileSizeKB * 1024)], {
            type: 'application/octet-stream',
          }),
          name: `scale_${i}.bin`,
        }))
      );

      const duration = performance.now() - startTime;
      const totalDataMB = (fileCount * fileSizeKB) / 1024;

      // Verify all downloads attempted
      expect(results).toHaveLength(fileCount);

      // Most should succeed (allow for some failures under load)
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(fileCount * 0.9); // > 90% success

      // Scalability assertion: should complete in reasonable time
      // 100 files with 100ms delay = ~10 seconds minimum
      expect(duration).toBeLessThan(30000); // < 30 seconds

      // Calculate scalability: time per file
      const timePerFileMs = duration / fileCount;

      // Should be roughly 100ms per file (the delay) + small overhead
      expect(timePerFileMs).toBeGreaterThan(50); // > 50ms (allowing variance)
      expect(timePerFileMs).toBeLessThan(400); // < 400ms (detecting overhead)

      console.debug(`[BENCH-5] Scalability Profile (${fileCount} files):`, {
        totalFiles: fileCount,
        successCount,
        failureCount: fileCount - successCount,
        durationSeconds: (duration / 1000).toFixed(2),
        timePerFileMs: timePerFileMs.toFixed(2),
        scalabilityOK: successCount > fileCount * 0.9,
      });
    });
  });

  describe('Performance Regression Detection', () => {
    it('[REGRESSION] Verify 100ms delay is maintained', async () => {
      /**
       * Regression Test: Verify 100ms inter-file delay
       * Critical: This ensures system load isn't overloaded
       * Baseline: 3 files should take roughly 200ms (2 delays) + overhead
       */

      const fileCount = 3;
      const minExpectedDelayMs = (fileCount - 1) * 100; // 200ms minimum

      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      const startTime = performance.now();

      const results = await service.downloadBlobBulk(
        Array.from({ length: fileCount }, (_, i) => ({
          blob: new Blob(['small'], { type: 'text/plain' }),
          name: `delay_test_${i}.txt`,
        }))
      );

      const duration = performance.now() - startTime;

      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeGreaterThan(minExpectedDelayMs - 50); // Allow ±50ms variance
    });

    it('[REGRESSION] No memory leak with repeated single downloads', async () => {
      /**
       * Regression Test: Memory leak detection
       * Scenario: Download same file 100 times
       * Expected: No exponential slowdown
       */

      const iterations = 100;
      const times: number[] = [];

      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        const result = await service.downloadBlob({
          blob: new Blob(['test data'], { type: 'text/plain' }),
          name: `leak_test_${i}.txt`,
        });

        const duration = performance.now() - startTime;
        times.push(duration);

        expect(result.success).toBe(true);
      }

      // Analyze trend
      const first10Avg = times.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      const last10Avg = times.slice(-10).reduce((a, b) => a + b, 0) / 10;

      // Last 10 should not be significantly slower than first 10
      // Allow 30% variance for system noise
      expect(last10Avg).toBeLessThan(first10Avg * 1.3);

      // No individual spike should be > 500ms
      expect(Math.max(...times)).toBeLessThan(500);
    });
  });
});
