import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mediaService } from '../../../src/shared/services/MediaService';

describe('MediaService.prefetchNextMedia with microtask scheduling', () => {
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

  it('schedules prefetch tasks in a microtask when schedule="microtask"', async () => {
    const spy = vi.spyOn<any, any>(mediaService as any, 'prefetchSingle').mockResolvedValue();
    await mediaService.prefetchNextMedia(['a', 'b', 'c'], 0, {
      prefetchRange: 1,
      schedule: 'microtask',
    });
    // Let microtasks resolve
    await Promise.resolve();
    // Plus a tick for setTimeout fallback, just in case
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
