/**
 * @file BulkDownloadService 재시도 액션 실패 항목 선택적 재시도 시퀀스 테스트 (GREEN)
 */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { BulkDownloadService } from '../../../../src/shared/services/BulkDownloadService';
import { toastManager } from '../../../../src/shared/services/UnifiedToastManager';

function m(url: string, name: string) {
  return { id: name, url, filename: name, type: 'image' } as const;
}

describe('BulkDownloadService 재시도 액션 시퀀스', () => {
  const svc = new BulkDownloadService();
  const originalFetch = globalThis.fetch;
  let fetchCalls: string[] = [];

  beforeEach(() => {
    toastManager.clear();
    fetchCalls = [];
    globalThis.fetch = vi.fn(async (u: any) => {
      const url = String(u);
      fetchCalls.push(url);
      if (url.includes('fail1') || url.includes('fail2')) throw new Error('NetFail');
      const BlobCtor: any = (globalThis as any).Blob;
      const ResponseCtor: any = (globalThis as any).Response;
      const blob = new BlobCtor([new Uint8Array([1])]);
      return new ResponseCtor(blob, { status: 200 });
    }) as any;
  });

  it('초기 부분 실패 후 재시도 클릭 시 실패한 URL만 다시 fetch 한다 (현재 구현은 단순 fetch 후 성공 토스트)', async () => {
    const result1 = await svc.downloadMultiple([
      m('https://ok/successA.jpg', 'a.jpg'),
      m('https://fail/fail1.jpg', 'b.jpg'),
      m('https://ok/successC.jpg', 'c.jpg'),
      m('https://fail/fail2.jpg', 'd.jpg'),
    ]);

    expect(result1.status).toBe('partial');
    expect(fetchCalls).toHaveLength(4);

    const warningToast = toastManager.getToasts().find(t => t.type === 'warning');
    expect(warningToast?.onAction).toBeDefined();

    // 재시도 전 fetch mock을 성공으로 전환
    globalThis.fetch = vi.fn(async (u: any) => {
      const url = String(u);
      fetchCalls.push(url);
      const BlobCtor: any = (globalThis as any).Blob;
      const ResponseCtor: any = (globalThis as any).Response;
      const blob = new BlobCtor([new Uint8Array([1])]);
      return new ResponseCtor(blob, { status: 200 });
    }) as any;

    warningToast!.onAction!();

    // 기대: 실패했던 2개만 재호출되어 총 6회. (현 구현은 fire-and-forget -> 동일)
    expect(fetchCalls).toHaveLength(6);
    const lastToast = toastManager.getToasts().slice(-1)[0];
    expect(lastToast?.type).toBe('success');
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });
});
