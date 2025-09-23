import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StaticVendorManager } from '@shared/external/vendors/vendor-manager-static';

// White-box test: 내부 상태(urlTimers/createdUrls) 메모리 누수 여부를 검증한다.
// 자동 URL 정리 타임아웃 이후 urlTimers에서도 키가 삭제되어야 한다.

describe('StaticVendorManager.getNativeDownload memory cleanup', () => {
  let realCreate: unknown;
  let realRevoke: unknown;

  beforeEach(() => {
    vi.useFakeTimers();
    // 안전한 모킹: Object URL 생성을 결정적 문자열로 고정
    const URLRef: any = (globalThis as any).URL || {};
    realCreate = URLRef.createObjectURL;
    realRevoke = URLRef.revokeObjectURL;
    URLRef.createObjectURL = vi.fn().mockReturnValue('blob:mock-url-1');
    URLRef.revokeObjectURL = vi.fn();
    (globalThis as any).URL = URLRef;
    // 인스턴스 초기화 리셋
    StaticVendorManager.resetInstance();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    // 원복
    const URLRef: any = (globalThis as any).URL || {};
    URLRef.createObjectURL = realCreate;
    URLRef.revokeObjectURL = realRevoke;
    (globalThis as any).URL = URLRef;
    StaticVendorManager.resetInstance();
    vi.restoreAllMocks();
  });

  it('auto cleanup should also remove urlTimers entry (no leak)', async () => {
    const mgr = StaticVendorManager.getInstance();
    const api = mgr.getNativeDownload();

    const BlobRef: any = (globalThis as any).Blob || class MockBlob {};
    const blob = new BlobRef(['x']);
    const url = api.createDownloadUrl(blob);

    // 생성 직후: urlTimers에 엔트리가 존재해야 함
    expect(
      ((mgr as unknown as Record<string, unknown>).urlTimers as Map<string, number>).has(url)
    ).toBe(true);

    // 자동 정리 타임아웃(60s) 경과시킨다
    vi.advanceTimersByTime(61_000);

    // createdUrls에서는 제거되어야 함
    expect(((mgr as unknown as Record<string, unknown>).createdUrls as Set<string>).has(url)).toBe(
      false
    );
    // 그리고 urlTimers에서도 제거되어야 함 (누수 방지)
    expect(
      ((mgr as unknown as Record<string, unknown>).urlTimers as Map<string, number>).has(url)
    ).toBe(false);

    // Object URL은 한번 이상 revoke되었어야 한다
    expect((globalThis as any).URL.revokeObjectURL).toHaveBeenCalledWith(url);
  });
});
