/**
 * @file RED: BulkDownloadService 재시도 액션 실제 실패 항목만 재다운로드 시퀀스 검증
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BulkDownloadService } from '../../../../src/shared/services/bulk-download-service';
import { toastManager } from '../../../../src/shared/services/unified-toast-manager';

function m(url: string, name: string) {
  return { id: name, url, filename: name, type: 'image' } as const;
}

describe('RED: BulkDownloadService 재시도 액션 시퀀스', () => {
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

  it('초기 부분 실패 후 재시도 클릭 시 실패한 URL만 다시 fetch 해야 한다', async () => {
    const result1 = await svc.downloadMultiple([
      m('https://ok/successA.jpg', 'a.jpg'),
      m('https://fail/fail1.jpg', 'b.jpg'),
      m('https://ok/successC.jpg', 'c.jpg'),
      m('https://fail/fail2.jpg', 'd.jpg'),
    ]);

    expect(result1.status).toBe('partial');
    // 최초 fetch 호출 4회 (각 항목 1회)
    expect(fetchCalls).toHaveLength(4);

    const warningToast = toastManager.getToasts().find(t => t.type === 'warning');
    expect(warningToast?.onAction).toBeDefined(); // RED: 아직 시퀀스 재시도는 구현 X

    // 재시도 전 fetch mock을 성공으로 전환 (모든 URL 성공)
    globalThis.fetch = vi.fn(async (u: any) => {
      const url = String(u);
      fetchCalls.push(url);
      const BlobCtor: any = (globalThis as any).Blob;
      const ResponseCtor: any = (globalThis as any).Response;
      const blob = new BlobCtor([new Uint8Array([1])]);
      return new ResponseCtor(blob, { status: 200 });
    }) as any;

    // 액션 실행
    warningToast!.onAction!();

    // 기대: 재시도는 실패했던 2개 URL만 다시 호출되어 총 호출 수 = 6
    // (현재 GREEN 구현은 재다운로드 자체를 수행하지 않으므로 이 assert가 RED)
    expect(fetchCalls).toHaveLength(6); // RED: 현재 4 -> 실패해야 함
    // 마지막 토스트는 전체 성공 시 success 이어야 함(실패 항목 모두 회복)
    const lastToast = toastManager.getToasts().slice(-1)[0];
    expect(lastToast?.type).toBe('success'); // 현재 구현은 조건에 상관없이 success 고정
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });
});
