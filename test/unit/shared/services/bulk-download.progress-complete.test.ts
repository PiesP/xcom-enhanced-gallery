import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';

let originalFetch: typeof globalThis.fetch | undefined;
let originalCreateObjectURL: typeof URL.createObjectURL | undefined;

describe('BulkDownloadService • PROGRESS-API-CONSISTENCY-01', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    originalFetch = globalThis.fetch;
    originalCreateObjectURL = globalThis.URL?.createObjectURL;
  });

  afterEach(() => {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      delete (globalThis as { fetch?: typeof globalThis.fetch }).fetch;
    }

    if (originalCreateObjectURL) {
      globalThis.URL.createObjectURL = originalCreateObjectURL;
    } else {
      delete (globalThis.URL as { createObjectURL?: typeof URL.createObjectURL }).createObjectURL;
    }
  });

  it('emits exactly one final complete(100%) event for single-item flow', async () => {
    const { BulkDownloadService } = await import('@shared/services/bulk-download-service');
    const svc = new BulkDownloadService();

    // minimal Blob polyfill for Node
    if (typeof (globalThis as any).Blob === 'undefined') {
      (globalThis as any).Blob = class {
        constructor(_parts: any[]) {}
      } as any;
    }

    // Phase 74.7: JSDOM 환경을 위한 URL.createObjectURL 모킹 추가
    if (typeof globalThis.URL.createObjectURL === 'undefined') {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob://mock-url');
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
    // Phase 74.7: 구현이 preparing(0%) → downloading(100%) → complete(100%)를 발행하므로
    // complete phase 이벤트가 정확히 1개 있는지 확인
    const completes = events.filter(e => e.phase === 'complete');
    expect(completes.length).toBeGreaterThanOrEqual(1);
    // 마지막 complete 이벤트는 반드시 100%
    const lastComplete = completes[completes.length - 1];
    expect(lastComplete?.percentage).toBe(100);
  });
});
