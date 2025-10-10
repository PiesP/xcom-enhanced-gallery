import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mediaService } from '../../../src/shared/services/MediaService';

describe('MediaService.prefetchNextMedia with raf scheduling', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // mock fetch to resolve with a small blob
    global.fetch = vi.fn(
      async () => new Response(new Blob([new Uint8Array([1, 2, 3])]))
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    mediaService.clearPrefetchCache();
    mediaService.cancelAllPrefetch();
  });

  it('schedules prefetch tasks on next animation frame when schedule="raf"', async () => {
    const spy = vi.spyOn<any, any>(mediaService as any, 'prefetchSingle').mockResolvedValue();
    vi.useFakeTimers();
    await mediaService.prefetchNextMedia(['a', 'b', 'c'], 0, {
      prefetchRange: 1,
      schedule: 'raf',
    });
    // Advance timers to trigger rAF fallback timer (~16ms)
    await vi.advanceTimersByTimeAsync(20);
    vi.useRealTimers();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
