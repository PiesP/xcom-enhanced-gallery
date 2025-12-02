import { PrefetchManager } from '@shared/services/media/prefetch-manager';
import { HttpRequestService } from '@shared/services/http-request-service';
import { scheduleIdle } from '@shared/utils/performance/idle-scheduler';
import type { MediaInfo } from '@shared/types/media.types';

vi.mock('@shared/services/http-request-service', () => ({
  HttpRequestService: {
    getInstance: vi.fn(),
  },
}));

vi.mock('@shared/utils/performance/idle-scheduler', () => ({
  scheduleIdle: vi.fn(),
}));

const mockHttpGet = vi.fn();
const httpInstance = { get: mockHttpGet } as unknown as HttpRequestService;
const getInstanceMock = vi.mocked(HttpRequestService.getInstance);
const scheduleIdleMock = vi.mocked(scheduleIdle);
const createMedia = (url: string) => ({ url } as MediaInfo);
const createHttpResponse = (
  overrides?: Partial<{ ok: boolean; data: Blob; status: number; statusText: string }>
) => ({
  ok: true,
  data: new Blob(['ok']) as Blob,
  status: 200,
  statusText: 'OK',
  ...overrides,
});

describe('PrefetchManager', () => {
  beforeEach(() => {
    mockHttpGet.mockReset();
    scheduleIdleMock.mockReset();
    scheduleIdleMock.mockImplementation(callback => {
      callback();
      return { cancel: vi.fn() };
    });
    getInstanceMock.mockReturnValue(httpInstance);
  });

  it('prefetches immediately when schedule is immediate', async () => {
    const manager = new PrefetchManager();
    const blob = new Blob(['immediate']);
    mockHttpGet.mockResolvedValueOnce({ ok: true, data: blob });

    await manager.prefetch(createMedia('https://example.com/image.jpg'), 'immediate');

    expect(scheduleIdleMock).not.toHaveBeenCalled();
    expect(mockHttpGet).toHaveBeenCalledTimes(1);
  });

  it('uses idle scheduler when schedule is idle', async () => {
    const manager = new PrefetchManager();
    const blob = new Blob(['idle']);
    mockHttpGet.mockResolvedValueOnce({ ok: true, data: blob });

    await manager.prefetch(createMedia('https://example.com/idle.jpg'), 'idle');

    expect(scheduleIdleMock).toHaveBeenCalledTimes(1);
    expect(mockHttpGet).toHaveBeenCalledWith(
      'https://example.com/idle.jpg',
      expect.objectContaining({ responseType: 'blob' })
    );
  });

  it('does not duplicate requests for cached media', async () => {
    const manager = new PrefetchManager();
    const blob = new Blob(['cache']);
    mockHttpGet.mockResolvedValue({ ok: true, data: blob });

    await manager.prefetch(createMedia('https://example.com/cache.jpg'), 'immediate');
    await manager.prefetch(createMedia('https://example.com/cache.jpg'), 'immediate');

    expect(mockHttpGet).toHaveBeenCalledTimes(1);
    const cached = manager.get('https://example.com/cache.jpg');
    expect(cached).not.toBeNull();
    await expect(cached).resolves.toBe(blob);
  });

  it('evicts the oldest cached entry when capacity is exceeded', async () => {
    const manager = new PrefetchManager(2);
    mockHttpGet
      .mockResolvedValueOnce(createHttpResponse({ data: new Blob(['one']) }))
      .mockResolvedValueOnce(createHttpResponse({ data: new Blob(['two']) }))
      .mockResolvedValueOnce(createHttpResponse({ data: new Blob(['three']) }));

    await manager.prefetch(createMedia('https://example.com/one.jpg'), 'immediate');
    await manager.prefetch(createMedia('https://example.com/two.jpg'), 'immediate');
    await manager.prefetch(createMedia('https://example.com/three.jpg'), 'immediate');

    expect(manager.has('https://example.com/one.jpg')).toBe(false);
    expect(manager.has('https://example.com/two.jpg')).toBe(true);
    expect(manager.has('https://example.com/three.jpg')).toBe(true);
  });

  it('removes failed requests from the cache when response is not ok', async () => {
    const manager = new PrefetchManager();
    mockHttpGet.mockResolvedValueOnce(
      createHttpResponse({ ok: false, status: 500, statusText: 'Server Error' })
    );

    await manager.prefetch(createMedia('https://example.com/fail.jpg'), 'immediate');

    expect(manager.has('https://example.com/fail.jpg')).toBe(false);
  });

  it('removes cache entries when request rejects', async () => {
    const manager = new PrefetchManager();
    mockHttpGet.mockRejectedValueOnce(new Error('network'));

    await manager.prefetch(createMedia('https://example.com/reject.jpg'), 'immediate');

    expect(manager.has('https://example.com/reject.jpg')).toBe(false);
  });

  it('cancelAll aborts active requests and clears the map', async () => {
    const manager = new PrefetchManager();
    let resolveRequest: ((value: ReturnType<typeof createHttpResponse>) => void) | undefined;
    mockHttpGet.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveRequest = resolve;
        })
    );

    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

    try {
      const pending = manager.prefetch(createMedia('https://example.com/pending.jpg'), 'immediate');

      manager.cancelAll();
      expect(abortSpy).toHaveBeenCalledTimes(1);

      resolveRequest?.(createHttpResponse());
      await pending;
    } finally {
      abortSpy.mockRestore();
    }
  });

  it('clear empties the cache contents', async () => {
    const manager = new PrefetchManager();
    mockHttpGet.mockResolvedValue(createHttpResponse());

    await manager.prefetch(createMedia('https://example.com/clear.jpg'), 'immediate');
    expect(manager.has('https://example.com/clear.jpg')).toBe(true);

    manager.clear();
    expect(manager.has('https://example.com/clear.jpg')).toBe(false);
    expect(manager.getCache().size).toBe(0);
  });

  it('destroy cancels requests and clears cache', () => {
    const manager = new PrefetchManager();
    const cancelSpy = vi.spyOn(manager, 'cancelAll');
    const clearSpy = vi.spyOn(manager, 'clear');

    manager.destroy();

    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });
});
