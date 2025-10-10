/**
 * @file BulkDownloadService 부분 실패 재시도 액션 토스트 테스트 (GREEN)
 */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { BulkDownloadService } from '../../../../src/shared/services/BulkDownloadService';
import { toastManager } from '../../../../src/shared/services/UnifiedToastManager';

function item(url: string, name: string) {
  return { id: name, url, filename: name, type: 'image' } as const;
}

describe('BulkDownloadService 부분 실패 재시도 액션', () => {
  const svc = new BulkDownloadService();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    toastManager.clear();
    globalThis.fetch = vi.fn(async (u: any) => {
      const url = String(u);
      if (url.includes('fail')) throw new Error('NetFail');
      const BlobCtor: any = (globalThis as any).Blob;
      const ResponseCtor: any = (globalThis as any).Response;
      const blob = new BlobCtor([new Uint8Array([1])]);
      return new ResponseCtor(blob, { status: 200 });
    }) as any;
  });

  it('부분 실패 warning 토스트에 재시도 액션이 있고, 클릭 시 실패 항목만 다시 시도하여 success 토스트를 표시한다', async () => {
    const warnSpy = vi.spyOn(toastManager, 'warning');
    const result1 = await svc.downloadMultiple([
      item('https://ok/a.jpg', 'a.jpg'),
      item('https://fail/b.jpg', 'b.jpg'),
    ]);
    expect(result1.status).toBe('partial');
    expect(warnSpy).toHaveBeenCalled();

    const retryToast = toastManager.getToasts().find(t => t.type === 'warning');
    expect(retryToast?.onAction).toBeDefined();

    // 재시도 전 실패 URL을 성공으로 전환
    globalThis.fetch = vi.fn(async () => {
      const BlobCtor: any = (globalThis as any).Blob;
      const ResponseCtor: any = (globalThis as any).Response;
      const blob = new BlobCtor([new Uint8Array([1])]);
      return new ResponseCtor(blob, { status: 200 });
    }) as any;

    retryToast!.onAction!();
    const latestToast = toastManager.getToasts().slice(-1)[0];
    expect(latestToast?.type).toBe('success');
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });
});
