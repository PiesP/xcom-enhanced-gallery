/**
 * BulkDownloadService - TDD tests for queue/concurrency/cancellation/retry (RED)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';

// Mock HttpRequestService before importing BulkDownloadService
vi.mock('@/shared/services/http-request-service', async () => {
  const actual = await vi.importActual<any>('@/shared/services/http-request-service');
  let mockGetInstance: any = null;

  return {
    ...actual,
    HttpRequestService: {
      ...actual.HttpRequestService,
      getInstance: vi.fn(function () {
        if (mockGetInstance) {
          return mockGetInstance;
        }
        return actual.HttpRequestService.getInstance();
      }),
    },
    httpRequestService: actual.httpRequestService,
    HttpError: actual.HttpError,
  };
});

// Partial mock: override only getNativeDownload, keep others intact
vi.mock('@/shared/external/vendors', async () => {
  const actual = await vi.importActual<any>('@/shared/external/vendors');
  return {
    ...actual,
    getNativeDownload: () => ({
      downloadBlob: vi.fn(),
    }),
  };
});

describe('BulkDownloadService - queue & concurrency', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function buildMedia(count: number, prefix = 'file'): any[] {
    return Array.from({ length: count }).map((_, i) => ({
      id: `${prefix}-${i}`,
      type: 'image',
      url: `https://example.com/${prefix}-${i}.bin`,
      originalUrl: `https://example.com/${prefix}-${i}.bin`,
      filename: `${prefix}-${i}.bin`,
      tweetId: '0',
    })) as any[];
  }

  it('should utilize concurrency when provided (RED: API to implement)', async () => {
    const { BulkDownloadService } = await import('@/shared/services/bulk-download-service');
    const { HttpRequestService } = await import('@/shared/services/http-request-service');

    const svc = new BulkDownloadService();

    // mock HttpRequestService measuring in-flight concurrency
    let current = 0;
    let peak = 0;

    const mockHttpService = {
      get: vi.fn(async () => {
        current++;
        peak = Math.max(peak, current);
        // emulate network delay
        await new Promise(resolve => setTimeout(resolve, 10));
        current--;
        return {
          ok: true,
          data: new Uint8Array([1, 2, 3]).buffer,
          status: 200,
        } as any;
      }),
    } as any;

    vi.spyOn(HttpRequestService, 'getInstance').mockReturnValue(mockHttpService);

    const items = buildMedia(5, 'concurrency');
    const result = await svc.downloadMultiple(items, { concurrency: 2 });

    expect(result.success).toBe(true);
    // Peak should be >= 2 if concurrency is honored
    expect(peak).toBeGreaterThanOrEqual(2);
  });

  it('should support cancellation via AbortSignal (RED)', async () => {
    const { BulkDownloadService } = await import('@/shared/services/bulk-download-service');
    const { HttpRequestService } = await import('@/shared/services/http-request-service');

    const svc = new BulkDownloadService();

    // Mock HttpRequestService to ensure abort signal is properly handled
    const mockInstance = {
      get: vi.fn(async (url: string, options?: any) => {
        // Check if already aborted before starting
        if (options?.signal?.aborted) {
          throw new Error('Download cancelled by user');
        }
        // delay long so we can cancel
        return new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve({
              ok: true,
              data: new Uint8Array([9]).buffer,
              status: 200,
            });
          }, 100);
          if (options?.signal) {
            const onAbort = () => {
              clearTimeout(timeout);
              reject(new Error('Download cancelled by user'));
            };
            options.signal.addEventListener('abort', onAbort, { once: true });
          }
        });
      }),
    } as any;

    vi.spyOn(HttpRequestService, 'getInstance').mockReturnValue(mockInstance);

    // eslint-disable-next-line no-undef
    const controller = new AbortController();

    const promise = svc.downloadMultiple(buildMedia(8, 'cancel'), {
      signal: controller.signal,
      concurrency: 3,
    });

    // cancel shortly after start
    setTimeout(() => controller.abort(), 5);

    const res = await promise;
    expect(res.success).toBe(false);
    expect(String(res.error || '').toLowerCase()).toContain('cancel');
    // service should not be stuck
    expect(svc.isDownloading()).toBe(false);
  });

  it('should retry failed downloads up to configured retries (RED)', async () => {
    const { BulkDownloadService } = await import('@/shared/services/bulk-download-service');
    const { HttpRequestService } = await import('@/shared/services/http-request-service');

    const svc = new BulkDownloadService();

    // Simulate first call fails, second succeeds for first item; others succeed
    let callCount = 0;
    const mockHttpService = {
      get: vi.fn(async (url: string) => {
        if (url.includes('retry-0')) {
          callCount++;
          if (callCount % 2 === 1) {
            // fail first attempt
            throw new Error('Network error');
          }
        }
        return {
          ok: true,
          data: new Uint8Array([7, 7, 7]).buffer,
          status: 200,
        } as any;
      }),
    } as any;

    vi.spyOn(HttpRequestService, 'getInstance').mockReturnValue(mockHttpService);

    const items = buildMedia(3, 'retry');
    const res = await svc.downloadMultiple(items, { retries: 1 });
    expect(res.success).toBe(true);
    expect(res.filesSuccessful).toBeGreaterThanOrEqual(3);
  });
});
