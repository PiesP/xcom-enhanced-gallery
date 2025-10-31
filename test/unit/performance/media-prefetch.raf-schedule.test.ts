import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mediaService } from '@/shared/services/media-service';

type MediaServiceWithInternals = typeof mediaService & {
  prefetchSingle: (url: string) => Promise<void>;
};

const mediaServiceInternal = mediaService as MediaServiceWithInternals;

describe('MediaService.prefetchNextMedia with raf scheduling', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // mock fetch to resolve with a small blob
    globalThis.fetch = vi.fn(
      async () => new globalThis.Response(new Uint8Array([1, 2, 3]))
    ) as typeof globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mediaService.clearPrefetchCache();
    mediaService.cancelAllPrefetch();
  });

  it('schedules prefetch tasks on next animation frame when schedule="raf"', async () => {
    const spy = vi.spyOn(mediaServiceInternal, 'prefetchSingle').mockResolvedValue(undefined);
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
