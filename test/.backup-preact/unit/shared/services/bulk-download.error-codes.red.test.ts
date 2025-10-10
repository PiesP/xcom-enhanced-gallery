import { describe, it, expect, vi } from 'vitest';
import { bulkDownloadService } from '@shared/services/BulkDownloadService';
import { ErrorCode } from '@shared/types/result.types';

// 간단한 fetch 모킹: 첫 번째 URL 성공, 두 번째 실패 시나리오 등

describe('BulkDownloadService Error Codes (RED)', () => {
  it('전체 실패 시 code=ALL_FAILED', async () => {
    const urls = ['u1', 'u2'];
    (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error('net fail')) as any;
    const res = await bulkDownloadService.downloadMultiple(
      urls.map(u => ({ url: u, type: 'image', filename: 'a.jpg' }) as any)
    );
    expect(res.status).toBe('error');
    expect((res as any).code).toBe(ErrorCode.ALL_FAILED); // RED: 아직 없음
  });

  it('부분 실패 시 code=PARTIAL_FAILED', async () => {
    const urls = ['u1', 'u2'];
    (globalThis as any).fetch = vi
      .fn()
      .mockResolvedValueOnce({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) })
      .mockRejectedValueOnce(new Error('net fail')) as any;
    const res = await bulkDownloadService.downloadMultiple(
      urls.map(u => ({ url: u, type: 'image', filename: 'a.jpg' }) as any)
    );
    expect(res.status === 'partial' || res.status === 'success').toBe(true);
    if (res.status === 'partial') {
      expect((res as any).code).toBe(ErrorCode.PARTIAL_FAILED); // RED
    }
  });
});
