import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mediaService } from '../../../src/shared/services/media-service';
import { runPrefetchBench } from '../../../src/shared/utils/performance';

/**
 * Prefetch bench harness
 * - Verifies the harness runs and produces a report with modes and non-negative times
 * - We don't assert absolute performance; only structural correctness and mode presence
 */
describe('Prefetch Bench Harness', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // mock fetch to resolve with a small blob
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-undef
    global.fetch = vi.fn(async () => new Response(new Blob([new Uint8Array([1, 2, 3])]))) as any;
    mediaService.clearPrefetchCache();
    mediaService.cancelAllPrefetch();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    mediaService.clearPrefetchCache();
    mediaService.cancelAllPrefetch();
  });

  it('runs bench for raf/idle/microtask and returns a valid report', async () => {
    const urls = ['u1', 'u2', 'u3', 'u4'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report = await runPrefetchBench(mediaService as any, {
      urls,
      currentIndex: 0,
      prefetchRange: 2,
      maxConcurrent: 2,
      modes: ['raf', 'idle', 'microtask'],
      timeoutMsPerMode: 200,
      pollIntervalMs: 1,
    });

    expect(report.entries.length).toBeGreaterThanOrEqual(1);
    for (const e of report.entries) {
      expect(['raf', 'idle', 'microtask']).toContain(e.mode);
      expect(e.elapsedMs).toBeGreaterThanOrEqual(0);
      expect(e.cacheEntries).toBeGreaterThanOrEqual(0);
    }
    expect(['raf', 'idle', 'microtask']).toContain(report.bestMode);
  });
});
