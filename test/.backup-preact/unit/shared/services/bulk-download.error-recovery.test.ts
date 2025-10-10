/**
 * @fileoverview Phase I: BulkDownloadService 오류/부분 실패/취소 UX 표준화 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BulkDownloadService } from '../../../../src/shared/services/BulkDownloadService';
import { toastManager } from '../../../../src/shared/services/UnifiedToastManager';

// 헬퍼: 성공/실패 미디어 항목
function makeItem(url: string, name: string) {
  return { id: name, url, filename: name, type: 'image' } as const;
}

describe('Phase I: BulkDownloadService 오류 복구 UX', () => {
  const originalFetch = globalThis.fetch;
  const svc = new BulkDownloadService();

  beforeEach(() => {
    // fetch 모킹: 특정 url 은 실패, 나머지는 성공 (RequestInfo 대신 unknown 사용)
    globalThis.fetch = vi.fn(async (input: unknown) => {
      const u = String(input);
      if (u.includes('fail')) {
        throw new Error('Network fail');
      }
      const BlobCtor: any = (globalThis as any).Blob;
      const ResponseCtor: any = (globalThis as any).Response;
      const blob = new BlobCtor([new Uint8Array([1])]);
      return new ResponseCtor(blob, { status: 200 });
    }) as any;
  });

  it('부분 실패 시 warning 토스트가 호출된다', async () => {
    const warnSpy = vi.spyOn(toastManager, 'warning');
    const items = [makeItem('https://ok/a.jpg', 'a.jpg'), makeItem('https://fail/b.jpg', 'b.jpg')];
    const result = await svc.downloadMultiple(items);
    expect(result.success).toBe(true); // 일부 성공
    expect(result.failures?.length).toBe(1);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('모두 실패 시 error 토스트가 호출된다', async () => {
    const errSpy = vi.spyOn(toastManager, 'error');
    globalThis.fetch = vi.fn(async () => {
      throw new Error('DOWN');
    }) as any;
    const items = [makeItem('https://fail/a.jpg', 'a.jpg')];
    const result = await svc.downloadMultiple(items);
    expect(result.success).toBe(false);
    expect(errSpy).toHaveBeenCalled();
  });

  it('취소 시 info 토스트가 호출된다', async () => {
    const infoSpy = vi.spyOn(toastManager, 'info');
    const AbortCtor: any =
      (globalThis as any).AbortController ||
      class {
        abort() {}
        signal: any;
      };
    const controller = new AbortCtor();
    // 느린 fetch 시뮬레이션
    globalThis.fetch = vi.fn(
      () =>
        new Promise((resolve, reject) => {
          // abort 신호를 기다렸다가 reject 하여 서비스 로직이 취소 에러를 처리하도록 유도
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Download cancelled by user'));
          });
        })
    ) as any;
    const p = svc.downloadMultiple([makeItem('https://ok/slow.jpg', 'slow.jpg')], {
      signal: controller.signal,
    });
    controller.abort();
    const result = await p;
    expect(result.success).toBe(false);
    expect(result.error?.toLowerCase()).toContain('cancelled');
    expect(infoSpy).toHaveBeenCalled();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });
});
