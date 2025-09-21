/**
 * @fileoverview RED: HTTP 에러 메시지 포맷 표준화 가드
 * 목표: 비-2xx 응답의 에러 메시지가 반드시 `http_<status>` 형식이어야 한다 (statusText 미포함)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bulkDownloadService } from '../../../../src/shared/services/BulkDownloadService';
import { mediaService as mediaServiceProxy } from '../../../../src/shared/services/MediaService';

describe('[RED] HTTP error format standardization', () => {
  const originalFetch = (globalThis as any).fetch;

  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).fetch = originalFetch;
  });

  it('MediaService.downloadSingle: non-2xx -> error message equals "http_404" (no statusText)', async () => {
    // Arrange: mock fetch 404 with statusText
    const Resp = (globalThis as any).Response;
    const mockResp = new Resp('', { status: 404, statusText: 'Not Found' });
    (globalThis as any).fetch = vi.fn().mockResolvedValue(mockResp);

    // Act
    const res = await mediaServiceProxy.downloadSingle({
      id: '1',
      url: 'https://x.com/404.jpg',
      filename: '404.jpg',
      type: 'image',
    } as any);

    // Assert
    expect(res.success).toBe(false);
    expect(res.status === 'error' || res.status === 'cancelled').toBe(true);
    // 핵심: 메시지는 정확히 http_404 이어야 하며 statusText가 포함되면 안됨
    expect(String(res.error)).toBe('http_404');
  });

  it('BulkDownloadService.downloadMultiple: non-2xx per-item -> failures[].error equals "http_500" (no statusText)', async () => {
    // Arrange: fetch 500 with statusText
    const Resp = (globalThis as any).Response;
    const mockResp = new Resp('', { status: 500, statusText: 'Internal Server Error' });
    (globalThis as any).fetch = vi.fn().mockResolvedValue(mockResp);

    // Act
    const res = await bulkDownloadService.downloadMultiple(
      [
        { id: 'a', url: 'https://x.com/a.jpg', filename: 'a.jpg', type: 'image' },
        { id: 'b', url: 'https://x.com/b.jpg', filename: 'b.jpg', type: 'image' },
      ] as any,
      { concurrency: 1, retries: 0 }
    );

    // Assert: 전체 실패가 예상되지만 핵심은 실패 메시지 포맷
    expect(res.success).toBe(false);
    expect(res.status === 'error' || res.status === 'cancelled').toBe(true);
    expect(res.failures && res.failures.length).toBeGreaterThan(0);
    for (const f of res.failures || []) {
      expect(f.error).toBe('http_500');
    }
  });
});
