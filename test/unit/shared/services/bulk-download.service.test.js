/**
 * BulkDownloadService - TDD tests for queue/concurrency/cancellation/retry
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Ensure timers and minimal Web APIs exist in test env
if (typeof globalThis.setTimeout !== 'function') {
  globalThis.setTimeout = (fn, ms) => {
    return require('timers').setTimeout(fn, ms);
  };
}
if (typeof globalThis.AbortController === 'undefined') {
  class SimpleAbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: () => {},
      };
    }
    abort() {
      this.signal.aborted = true;
    }
  }
  // @ts-ignore
  globalThis.AbortController = SimpleAbortController;
}
if (typeof globalThis.Blob === 'undefined') {
  // Minimal Blob polyfill for tests
  class SimpleBlob {
    constructor(parts) {
      this.parts = parts;
    }
  }
  // @ts-ignore
  globalThis.Blob = SimpleBlob;
}

// Partial mock: override only getNativeDownload, keep others intact
vi.mock('@shared/external/vendors', async () => {
  const actual = await vi.importActual('@shared/external/vendors');
  return {
    ...actual,
    getNativeDownload: () => ({
      downloadBlob: vi.fn(),
    }),
  };
});

describe('BulkDownloadService - queue & concurrency', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function buildMedia(count, prefix = 'file') {
    return Array.from({ length: count }).map((_, i) => ({
      id: `${prefix}-${i}`,
      type: 'image',
      url: `https://example.com/${prefix}-${i}.bin`,
      originalUrl: `https://example.com/${prefix}-${i}.bin`,
      filename: `${prefix}-${i}.bin`,
      tweetId: '0',
    }));
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
      await new Promise(r => setTimeout(r, 20));
      current--;
      return {
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
        blob: async () => new Blob([new Uint8Array([1, 2, 3])]),
      };
    });

    const items = buildMedia(7, 'concurrency');
    // RED: BulkDownloadService currently ignores concurrency; test defines expectation
    const result = await svc.downloadMultiple(items, { concurrency: 2 });

    expect(result.success).toBe(true);
    // Peak should not remain at 1 if concurrency is honored
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
      await new Promise(r => setTimeout(r, 50));
      return {
        ok: true,
        arrayBuffer: async () => new Uint8Array([9]).buffer,
      };
    });

    const promise = svc.downloadMultiple(buildMedia(10, 'cancel'), {
      signal: controller.signal,
      concurrency: 3,
    });

    // cancel shortly after start
    setTimeout(() => controller.abort(), 30);

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
    globalThis.fetch = vi.fn(async input => {
      const url = typeof input === 'string' ? input : String(input);
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
      };
    });

    const items = buildMedia(3, 'retry');
    const res = await svc.downloadMultiple(items, { retries: 1 });
    expect(res.success).toBe(true);
    expect(res.filesSuccessful).toBeGreaterThanOrEqual(3);
  });
});
