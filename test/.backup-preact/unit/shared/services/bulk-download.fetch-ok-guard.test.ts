import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('BulkDownloadService • FETCH-OK-GUARD-01', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // cleanup fetch mock
    // @ts-expect-error test env cleanup
    globalThis.fetch = undefined;
  });

  it('treats non-OK response as a failure during ZIP flow (partial success)', async () => {
    const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');
    const svc = new BulkDownloadService();

    const okUrl = 'https://example.com/ok.jpg';
    const badUrl = 'https://example.com/bad.jpg';

    // Mock fetch: okUrl => ok:true, badUrl => ok:false but still returns body
    // Current orchestrator should reject bad ok after fix
    globalThis.fetch = vi.fn(async (input: any) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url.includes('bad')) {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
          blob: async () => new Blob([new Uint8Array([1, 2, 3])]),
          headers: new Map(),
        } as any;
      }
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        arrayBuffer: async () => new Uint8Array([5, 6, 7]).buffer,
        blob: async () => new Blob([new Uint8Array([5, 6, 7])]),
        headers: new Map(),
      } as any;
    }) as any;

    const items = [
      { id: '1', url: okUrl, type: 'image', tweetId: 't1', tweetUsername: 'alice' },
      { id: '2', url: badUrl, type: 'image', tweetId: 't2', tweetUsername: 'bob' },
    ];

    // To avoid real Blob usage issues in Node, provide a minimal polyfill if needed
    if (typeof (globalThis as any).Blob === 'undefined') {
      (globalThis as any).Blob = class {
        private _parts: any[];
        constructor(parts: any[]) {
          this._parts = parts;
        }
      } as any;
    }

    const res = await svc.downloadMultiple(items as any, { zipFilename: 'test.zip' });

    expect(res.success).toBe(true); // partial is success=true
    expect(res.status === 'partial' || res.status === 'success').toBe(true);
    expect(res.filesProcessed).toBe(2);
    expect(res.filesSuccessful).toBe(1);
    expect(res.failures && res.failures.length).toBe(1);
    expect(res.failures?.[0]?.url).toContain(badUrl);
    expect(String(res.failures?.[0]?.error || '').toLowerCase()).toContain('http');
  });

  it('single-item path: non-OK response yields error result (no success)', async () => {
    const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');
    const svc = new BulkDownloadService();

    const badUrl = 'https://example.com/bad-single.jpg';

    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      arrayBuffer: async () => new Uint8Array([9]).buffer,
      blob: async () => new Blob([new Uint8Array([9])]),
      headers: new Map(),
    })) as any;

    // minimal Blob polyfill for Node if not present
    if (typeof (globalThis as any).Blob === 'undefined') {
      (globalThis as any).Blob = class {
        constructor(_parts: any[]) {}
      } as any;
    }

    const res = await svc.downloadMultiple(
      [{ id: 'x', url: badUrl, type: 'image', tweetId: 't', tweetUsername: 'u' }] as any,
      {}
    );

    expect(res.success).toBe(false);
    expect(res.status).toBe('error');
    expect(String(res.error || '').toLowerCase()).toContain('http');
  });
});
