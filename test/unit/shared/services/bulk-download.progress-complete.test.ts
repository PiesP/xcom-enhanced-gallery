import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('BulkDownloadService • PROGRESS-API-CONSISTENCY-01', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // @ts-expect-error cleanup
    globalThis.fetch = undefined;
  });

  it('emits exactly one final complete(100%) event for single-item flow', async () => {
    const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');
    const svc = new BulkDownloadService();

    // minimal Blob polyfill for Node
    if (typeof (globalThis as any).Blob === 'undefined') {
      (globalThis as any).Blob = class {
        constructor(_parts: any[]) {}
      } as any;
    }

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      blob: async () => new Blob([new Uint8Array([1, 2, 3])]),
      headers: new Map(),
    })) as any;

    const events: Array<{ phase: string; percentage: number }> = [];

    const res = await svc.downloadMultiple(
      [
        { id: '1', url: 'https://ok/single.jpg', type: 'image', tweetId: 't', tweetUsername: 'u' },
      ] as any,
      {
        onProgress: p => {
          events.push({ phase: p.phase, percentage: p.percentage });
        },
      }
    );

    expect(res.success).toBe(true);
    // Allow implementations to optionally emit preparing/downloading; but must have exactly one final complete
    const completes = events.filter(e => e.phase === 'complete');
    expect(completes).toHaveLength(1);
    expect(completes[0]?.percentage).toBe(100);
  });
});
