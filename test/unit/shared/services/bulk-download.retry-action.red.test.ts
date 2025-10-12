/**
 * @file RED: BulkDownloadService 부분 실패 재시도 액션 토스트 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BulkDownloadService } from '../../../../src/shared/services/bulk-download-service';
import { toastManager } from '../../../../src/shared/services/unified-toast-manager';

function item(url: string, name: string) {
  return { id: name, url, filename: name, type: 'image' } as const;
}

describe('RED: BulkDownloadService 부분 실패 재시도 액션', () => {
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

  it('부분 실패 warning 토스트에 재시도 액션이 있고, 클릭 시 실패 항목만 다시 시도하여 status가 success로 개선되어야 한다', async () => {
    const warnSpy = vi.spyOn(toastManager, 'warning');
    // 1차: b.jpg 실패(네트워크), a.jpg 성공 → partial
    const result1 = await svc.downloadMultiple([
      item('https://ok/a.jpg', 'a.jpg'),
      item('https://fail/b.jpg', 'b.jpg'),
    ]);
    expect(result1.status).toBe('partial');
    expect(warnSpy).toHaveBeenCalled();

    // 토스트 중 하나에 action(onAction) 존재 가정
    const retryToast = toastManager.getToasts().find(t => t.type === 'warning');
    expect(retryToast?.onAction).toBeDefined(); // RED: 현재 없음 → 실패해야 함

    // 재시도 전에 fetch 모킹을 성공으로 변경(b.jpg 성공)
    globalThis.fetch = vi.fn(async () => {
      const BlobCtor: any = (globalThis as any).Blob;
      const ResponseCtor: any = (globalThis as any).Response;
      const blob = new BlobCtor([new Uint8Array([1])]);
      return new ResponseCtor(blob, { status: 200 });
    }) as any;

    // 액션 실행 (실패 항목만 재시도 기대)
    retryToast!.onAction!();

    // 재시도 후 새로운 성공 토스트 또는 내부 상태 개선 확인 로직 (단순화)
    // 구현 목표: 재시도 로직이 부분 실패 → success 로 전환
    const latestToast = toastManager.getToasts().slice(-1)[0];
    expect(latestToast?.type).toBe('success'); // RED: 아직 구현 안 됨
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });
});
