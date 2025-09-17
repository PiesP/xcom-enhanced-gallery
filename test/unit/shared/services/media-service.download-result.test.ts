/**
 * @fileoverview Phase E: MediaService 다운로드 Result 계약 테스트
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { mediaService } from '../../../../src/shared/services/MediaService';

describe('Phase E: downloadSingle Result 계약', () => {
  const originalFetch = (globalThis as any).fetch;

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
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
