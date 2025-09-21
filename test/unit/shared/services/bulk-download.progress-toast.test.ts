/**
 * BulkDownloadService progress toast behavior
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@shared/external/vendors', async () => {
  const actual = await vi.importActual<any>('@shared/external/vendors');
  return {
    ...actual,
    getNativeDownload: () => ({ downloadBlob: vi.fn() }),
  };
});

// Speed up LanguageService detection
vi.stubGlobal('navigator', { language: 'en-US' } as any);

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

describe('BulkDownloadService – progress toast', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('shows and updates progress toast when enabled', async () => {
    const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');
    const svc = new BulkDownloadService();

    // Mock fetch to simulate data and allow multiple calls
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    })) as any;

    // Spy into toast manager by subscribing via UnifiedToastManager API
    const { toastManager, UnifiedToastManager } = await import(
      '@shared/services/UnifiedToastManager'
    );
    UnifiedToastManager.resetInstance();
    const tm = toastManager;

    const updates: any[] = [];
    const unsub = tm.subscribe(list => updates.push(list.map(t => t.message)));

    const items = buildMedia(3);
    const res = await svc.downloadMultiple(items, { concurrency: 1, showProgressToast: true });

    unsub();

    expect(res.success).toBe(true);
    // Expect at least one progress message update occurred during download
    const sawProgress = updates.some(batch => batch.some((m: string) => m?.includes('1/3')));
    expect(sawProgress).toBe(true);

    // After completion, last list should be empty (progress toast removed)
    const last = updates[updates.length - 1] || [];
    expect(last.length).toBe(0);
  });

  it('does not show progress toast when disabled', async () => {
    const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');
    const svc = new BulkDownloadService();

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1]).buffer,
    })) as any;

    const { toastManager, UnifiedToastManager } = await import(
      '@shared/services/UnifiedToastManager'
    );
    UnifiedToastManager.resetInstance();
    const tm = toastManager;
    const updates: any[] = [];
    const unsub = tm.subscribe(list => updates.push(list.map(t => t.message)));

    const res = await svc.downloadMultiple(buildMedia(2), {
      concurrency: 1,
      showProgressToast: false,
    });

    unsub();

    expect(res.success).toBe(true);
    // No progress messages should be observed
    const sawProgress = updates.some(batch =>
      batch.some((m: string) => typeof m === 'string' && m.includes('1/2'))
    );
    expect(sawProgress).toBe(false);
  });
});
