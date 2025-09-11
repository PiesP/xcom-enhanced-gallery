import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mediaService } from '../../../src/shared/services/MediaService';

describe('MediaService.prefetchNextMedia with idle scheduling', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // mock fetch to resolve with a small blob
    global.fetch = vi.fn(async () =>
      new Response(new Blob([new Uint8Array([1, 2, 3])]))
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    mediaService.clearPrefetchCache();
    mediaService.cancelAllPrefetch();
  });

  it('keeps default immediate behavior when schedule option is not provided', async () => {
    const spy = vi.spyOn<any, any>(mediaService as any, 'prefetchSingle');
    await mediaService.prefetchNextMedia(['a', 'b', 'c'], 0, { prefetchRange: 1 });
    // immediate path should synchronously schedule at least one call
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('schedules prefetch tasks during idle when schedule="idle"', async () => {
    const spy = vi.spyOn<any, any>(mediaService as any, 'prefetchSingle').mockResolvedValue();
    await mediaService.prefetchNextMedia(['a', 'b', 'c'], 0, { prefetchRange: 1, schedule: 'idle' });
    // Allow microtasks and timers to flush
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
