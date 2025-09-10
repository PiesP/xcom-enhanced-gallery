/**
 * BulkDownloadService - TDD tests for queue/concurrency/cancellation/retry (RED)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { MediaInfo } from '@shared/types/media.types';

// Partial mock: override only getNativeDownload, keep others intact
vi.mock('@shared/external/vendors', async () => {
  const actual = await vi.importActual<any>('@shared/external/vendors');
  return {
    ...actual,
    getNativeDownload: () => ({
      downloadBlob: vi.fn(),
    }),
  };
});

describe('BulkDownloadService - queue & concurrency', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function buildMedia(count: number, prefix = 'file'): MediaInfo[] {
    return Array.from({ length: count }).map((_, i) => ({
      id: `${prefix}-${i}`,
      type: 'image',
      url: `https://example.com/${prefix}-${i}.bin`,
      originalUrl: `https://example.com/${prefix}-${i}.bin`,
      filename: `${prefix}-${i}.bin`,
      tweetId: '0',
    })) as MediaInfo[];
  }

  it('should utilize concurrency when provided (RED: API to implement)', async () => {
    const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');
    const svc = new BulkDownloadService();

    // mock fetch measuring in-flight concurrency
    let current = 0;
    let peak = 0;

    globalThis.fetch = vi.fn(async () => {
      current++;
      peak = Math.max(peak, current);
      // emulate network delay
      await new Promise(resolve => setTimeout(resolve, 10));
      current--;
      return {
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      } as any;
    }) as any;

    const items = buildMedia(5, 'concurrency');
    // @ts-expect-error - concurrency option to be implemented
    const result = await svc.downloadMultiple(items, { concurrency: 2 });

    expect(result.success).toBe(true);
    // Peak should be >= 2 if concurrency is honored
    expect(peak).toBeGreaterThanOrEqual(2);
  });

  it('should support cancellation via AbortSignal (RED)', async () => {
    const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');
    const svc = new BulkDownloadService();

    const controller = new AbortController();
    let started = 0;

    globalThis.fetch = vi.fn(async () => {
      started++;
      // delay long so we can cancel
      await new Promise(resolve => setTimeout(resolve, 20));
      return {
        ok: true,
        arrayBuffer: async () => new Uint8Array([9]).buffer,
      } as any;
    }) as any;

    // @ts-expect-error - concurrency option to be implemented
    const promise = svc.downloadMultiple(buildMedia(8, 'cancel'), {
      signal: controller.signal,
      concurrency: 3,
    });

    // cancel shortly after start
    setTimeout(() => controller.abort(), 5);

    const res = await promise;
    expect(res.success).toBe(false);
    expect(String(res.error || '').toLowerCase()).toContain('cancel');
    // at least some started
    expect(started).toBeGreaterThan(0);
    // service should not be stuck
    expect(svc.isDownloading()).toBe(false);
  });

  it('should retry failed downloads up to configured retries (RED)', async () => {
    const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');
    const svc = new BulkDownloadService();

    // Simulate first call fails, second succeeds for first item; others succeed
    let callCount = 0;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as URL).toString();
      if (url.includes('retry-0')) {
        callCount++;
        if (callCount % 2 === 1) {
          // fail first attempt
          throw new Error('Network error');
        }
      }
      return {
        ok: true,
        arrayBuffer: async () => new Uint8Array([7, 7, 7]).buffer,
      } as any;
    }) as any;

    const items = buildMedia(3, 'retry');
    // @ts-expect-error - retries option to be implemented
    const res = await svc.downloadMultiple(items, { retries: 1 });
    expect(res.success).toBe(true);
    expect(res.filesSuccessful).toBeGreaterThanOrEqual(3);
  });
});
