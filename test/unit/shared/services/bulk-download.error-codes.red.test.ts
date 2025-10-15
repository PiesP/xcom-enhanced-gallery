import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bulkDownloadService } from '@shared/services/bulk-download-service';
import { ErrorCode } from '@shared/types/result.types';

// URL.createObjectURL 모킹
beforeEach(() => {
  if (!global.URL.createObjectURL) {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
  }
  if (!global.URL.revokeObjectURL) {
    global.URL.revokeObjectURL = vi.fn();
  }
});

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
