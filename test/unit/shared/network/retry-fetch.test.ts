/**
 * @fileoverview Tests for retry-fetch utilities
 */
import {
  DEFAULT_BACKOFF_BASE_MS,
  fetchArrayBufferWithRetry,
  sleep,
} from '@shared/network/retry-fetch';
import { HttpRequestService } from '@shared/services/http-request-service';

describe('retry-fetch', () => {
  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should resolve after specified delay', async () => {
      const promise = sleep(100);
      vi.advanceTimersByTime(100);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should resolve immediately for zero or negative delay', async () => {
      await expect(sleep(0)).resolves.toBeUndefined();
      await expect(sleep(-100)).resolves.toBeUndefined();
    });

    it('should reject when signal is aborted', async () => {
      const controller = new AbortController();
      const promise = sleep(1000, controller.signal);

      controller.abort();
      vi.advanceTimersByTime(100);

      await expect(promise).rejects.toThrow('Download cancelled by user');
    });

    it('should remove abort listener after sleep resolves', async () => {
      const controller = new AbortController();
      const removeSpy = vi.spyOn(controller.signal, 'removeEventListener');
      const promise = sleep(10, controller.signal);
      vi.advanceTimersByTime(10);
      await promise;
      expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
    });

    it('should remove abort listener after sleep is aborted', async () => {
      const controller = new AbortController();
      const removeSpy = vi.spyOn(controller.signal, 'removeEventListener');
      const promise = sleep(1000, controller.signal);

      controller.abort();
      await expect(promise).rejects.toThrow();

      expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
    });
  });

  describe('fetchArrayBufferWithRetry', () => {
    let httpServiceMock: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.useFakeTimers();
      httpServiceMock = vi.spyOn(HttpRequestService.getInstance(), 'get');
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('should return data on successful fetch', async () => {
      const mockData = new ArrayBuffer(8);
      httpServiceMock.mockResolvedValue({
        ok: true,
        status: 200,
        data: mockData,
      });

      const result = await fetchArrayBufferWithRetry('https://example.com/image.jpg', 3);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(8);
    });

    it('should retry on failure', async () => {
      const mockData = new ArrayBuffer(8);
      httpServiceMock.mockRejectedValueOnce(new Error('Network error')).mockResolvedValue({
        ok: true,
        status: 200,
        data: mockData,
      });

      const promise = fetchArrayBufferWithRetry('https://example.com/image.jpg', 3, undefined, 100);

      // Advance time for first retry delay
      await vi.advanceTimersByTimeAsync(100);

      const result = await promise;
      expect(result).toBeInstanceOf(Uint8Array);
      expect(httpServiceMock).toHaveBeenCalledTimes(2);
    });

    it('should throw after exhausting retries', async () => {
      // Use real timers to avoid unhandled rejection timing issues
      vi.useRealTimers();

      httpServiceMock.mockRejectedValue(new Error('Persistent error'));

      // Use 0 retries and minimal backoff to keep test fast
      await expect(
        fetchArrayBufferWithRetry(
          'https://example.com/image.jpg',
          0 // 0 retries means 1 attempt only
        )
      ).rejects.toThrow('Persistent error');

      expect(httpServiceMock).toHaveBeenCalledTimes(1);

      // Restore fake timers for other tests
      vi.useFakeTimers();
    });

    it('should throw on HTTP error status', async () => {
      httpServiceMock.mockResolvedValue({
        ok: false,
        status: 404,
        data: null,
      });

      const promise = fetchArrayBufferWithRetry('https://example.com/notfound.jpg', 0);

      await expect(promise).rejects.toThrow('HTTP error: 404');
    });

    it('should cancel on abort signal', async () => {
      const controller = new AbortController();
      controller.abort();

      const promise = fetchArrayBufferWithRetry(
        'https://example.com/image.jpg',
        3,
        controller.signal
      );

      await expect(promise).rejects.toThrow('Download cancelled by user');
      expect(httpServiceMock).not.toHaveBeenCalled();
    });

    it('should use default backoff base', () => {
      expect(DEFAULT_BACKOFF_BASE_MS).toBe(200);
    });

    it('should use correct options for http request', async () => {
      const mockData = new ArrayBuffer(8);
      httpServiceMock.mockResolvedValue({
        ok: true,
        status: 200,
        data: mockData,
      });

      const controller = new AbortController();
      await fetchArrayBufferWithRetry('https://example.com/image.jpg', 3, controller.signal);

      expect(httpServiceMock).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        expect.objectContaining({
          responseType: 'arraybuffer',
          timeout: 30000,
          signal: controller.signal,
        })
      );
    });

    it('should fail after multiple retries', async () => {
      httpServiceMock.mockRejectedValue(new Error('Persistent error'));

      const promise = fetchArrayBufferWithRetry(
        'https://example.com/image.jpg',
        2, // 2 retries = 3 attempts
        undefined,
        100
      );

      // Attach handler immediately to avoid unhandled rejection
      const expectation = expect(promise).rejects.toThrow('Persistent error');

      // Attempt 1 fails immediately
      // Wait for backoff 1 (100ms)
      await vi.advanceTimersByTimeAsync(100);
      // Attempt 2 fails
      // Wait for backoff 2 (200ms)
      await vi.advanceTimersByTimeAsync(200);
      // Attempt 3 fails -> throws

      await expectation;
      expect(httpServiceMock).toHaveBeenCalledTimes(3);
    });

    it('should respect backoff delay for multiple retries', async () => {
      httpServiceMock
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue({
          ok: true,
          status: 200,
          data: new ArrayBuffer(1),
        });

      const backoffBase = 1000;
      const promise = fetchArrayBufferWithRetry(
        'https://example.com/image.jpg',
        3,
        undefined,
        backoffBase
      );

      // Initial call
      expect(httpServiceMock).toHaveBeenCalledTimes(1);

      // --- Retry 1 ---
      // Delay should be backoffBase * 2^0 = 1000ms

      // Advance partial time
      await vi.advanceTimersByTimeAsync(500);
      expect(httpServiceMock).toHaveBeenCalledTimes(1);

      // Advance rest of time
      await vi.advanceTimersByTimeAsync(500);
      expect(httpServiceMock).toHaveBeenCalledTimes(2);

      // --- Retry 2 ---
      // Delay should be backoffBase * 2^1 = 2000ms
      // Mutant (division) would be 1000 / 2 = 500ms

      // Advance 1000ms (should be enough for mutant, but not for correct code)
      await vi.advanceTimersByTimeAsync(1000);
      // If mutant was active, it would have called by now (total 1000ms passed since last retry)
      // But correct code needs 2000ms.
      expect(httpServiceMock).toHaveBeenCalledTimes(2);

      // Advance remaining 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      expect(httpServiceMock).toHaveBeenCalledTimes(3);

      await promise;
    });
  });
});
