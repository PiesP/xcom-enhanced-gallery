import { describe, it, expect, vi, afterEach } from 'vitest';
import { mediaService } from '@/shared/services/MediaService';
import { bulkDownloadService } from '@/shared/services/BulkDownloadService';
import { ErrorCode } from '@/shared/types/result.types';

describe('EPIC-B: Error/Toast standardization (RED)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.clearAllMocks();
  });

  it('MediaService.downloadSingle should treat non-2xx as failure', async () => {
    const ResponseCtor: any = (globalThis as any).Response;
    globalThis.fetch = vi.fn(async () => new ResponseCtor('NF', { status: 404 })) as any;

    const res: any = await mediaService.downloadSingle({
      id: 'x',
      url: 'https://example.com/404.jpg',
      type: 'image',
      filename: 'nf.jpg',
      width: 10,
      height: 10,
    } as any);

    expect(res.success).toBe(false);
    expect(res.status === 'error' || res.status === 'cancelled').toBe(true);
  });

  it('BulkDownloadService.downloadMultiple should count non-2xx as failures (ALL_FAILED code)', async () => {
    const ResponseCtor: any = (globalThis as any).Response;
    globalThis.fetch = vi.fn(async () => new ResponseCtor('NF', { status: 404 })) as any;

    const res: any = await bulkDownloadService.downloadMultiple([
      { url: 'a', type: 'image', filename: 'a.jpg' } as any,
      { url: 'b', type: 'image', filename: 'b.jpg' } as any,
    ]);

    expect(res.status).toBe('error');
    expect(res.code).toBe(ErrorCode.ALL_FAILED);
  });
});
