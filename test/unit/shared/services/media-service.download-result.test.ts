/**
 * @fileoverview Phase E: MediaService 다운로드 Result 계약 테스트
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mediaService } from '../../../../src/shared/services/MediaService';
import * as accessors from '../../../../src/shared/container/service-accessors';

describe('Phase E: downloadSingle Result 계약', () => {
  const originalFetch = (globalThis as any).fetch;
  let restoreAccessor: (() => void) | null = null;

  beforeEach(() => {
    // Provide a fake BulkDownloadService so MediaService delegation works in isolation
    const fake = {
      downloadSingle: vi.fn(async (media: any) => {
        // If fetch is mocked to throw, simulate error path
        try {
          if (typeof (globalThis as any).fetch === 'function') {
            await (globalThis as any).fetch(media?.url ?? '');
          }
          return { success: true, status: 'success', filename: media?.filename ?? 'file' };
        } catch (e: any) {
          return { success: false, status: 'error', error: String(e?.message ?? e) };
        }
      }),
      downloadMultiple: vi.fn(async (_items: any[]) => ({
        success: false,
        status: 'error',
        filesProcessed: Array.isArray(_items) ? _items.length : 0,
        filesSuccessful: 0,
        error: 'No files to download',
      })),
    };
    const spy = vi
      .spyOn(accessors, 'getBulkDownloadServiceFromContainer')
      .mockImplementation(() => fake as any);
    restoreAccessor = () => spy.mockRestore();
  });

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    if (restoreAccessor) {
      restoreAccessor();
      restoreAccessor = null;
    }
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
