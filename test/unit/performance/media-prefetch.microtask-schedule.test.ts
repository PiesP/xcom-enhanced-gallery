import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mediaService } from '../../../src/shared/services/MediaService';

type MediaServiceWithInternals = typeof mediaService & {
  prefetchSingle: (url: string) => Promise<void>;
};

const mediaServiceInternal = mediaService as MediaServiceWithInternals;

describe('MediaService.prefetchNextMedia with microtask scheduling', () => {
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

  it('schedules prefetch tasks in a microtask when schedule="microtask"', async () => {
    const spy = vi.spyOn(mediaServiceInternal, 'prefetchSingle').mockResolvedValue(undefined);
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
