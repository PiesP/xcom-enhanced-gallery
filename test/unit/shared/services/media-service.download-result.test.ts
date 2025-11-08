/**
 * @fileoverview Phase E: MediaService 다운로드 Result 계약 테스트
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { mediaService } from '@/shared/services/media-service';

describe('Phase E: downloadSingle Result 계약', () => {
  setupGlobalTestIsolation();

  const originalFetch = (globalThis as any).fetch;

  beforeEach(async () => {
    // Phase 323-4: Mock UnifiedDownloadService instead of removed getBulkDownloadServiceFromContainer
    vi.doMock('@/shared/services/unified-download-service', () => ({
      unifiedDownloadService: {
        downloadSingle: vi.fn(async (media: any) => {
          // If fetch is mocked to throw, simulate error path
          try {
            if (typeof (globalThis as any).fetch === 'function') {
              await (globalThis as any).fetch(media?.url ?? '');
            }
            return { success: true, filename: media?.filename ?? 'file' };
          } catch (e: any) {
            return { success: false, error: String(e?.message ?? e) };
          }
        }),
        downloadBulk: vi.fn(async (_items: any[]) => ({
          success: false,
          status: 'error',
          filesProcessed: Array.isArray(_items) ? _items.length : 0,
          filesSuccessful: 0,
          error: 'No files to download',
        })),
      },
    }));
  });

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    vi.doUnmock('@/shared/services/unified-download-service');
  });

  it('실패 시 { success:false, error } 형태를 반환한다', async () => {
    (globalThis as any).fetch = vi.fn(async () => {
      throw new Error('blocked');
    });

    const result = await mediaService.downloadSingle({
      id: '1',
      url: 'https://example.com/a.jpg',
      type: 'image',
      filename: 'a.jpg',
      width: 100,
      height: 100,
    } as any);

    expect(result.success).toBe(false);
    expect(typeof result.error).toBe('string');
  });

  it('성공 시 { success:true, filename } 형태를 반환한다', async () => {
    (globalThis as any).fetch = vi.fn(async () => {
      const BlobCtor = (globalThis as any).Blob;
      const ResponseCtor = (globalThis as any).Response;
      const blob = new BlobCtor([new Uint8Array([1, 2, 3])]);
      return new ResponseCtor(blob);
    });

    const result = await mediaService.downloadSingle({
      id: '2',
      url: 'https://example.com/b.jpg',
      type: 'image',
      filename: 'b.jpg',
      width: 100,
      height: 100,
    } as any);

    expect(result.success).toBe(true);
    expect(typeof result.filename).toBe('string');
  });
});
