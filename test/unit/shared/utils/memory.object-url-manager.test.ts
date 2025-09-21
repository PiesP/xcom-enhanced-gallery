import { describe, it, expect, vi } from 'vitest';
import { createManagedObjectURL, revokeManagedObjectURL } from '@/shared/utils/memory';

describe('object-url-manager', () => {
  it('creates and revokes object URL via resource manager', () => {
    // create/revoke를 스텁하여 Blob 의존 없이 동작 검증
    const G: any = globalThis as any;
    // URL 존재 보장 및 정적 메서드 주입
    if (!G.URL) {
      G.URL = function URLCtor() {} as any;
    }
    const originalCreate = G.URL.createObjectURL;
    const originalRevoke = G.URL.revokeObjectURL;
    const createMock = vi.fn(() => 'blob:test-1');
    const revokeMock = vi.fn(() => {});
    G.URL.createObjectURL = createMock;
    G.URL.revokeObjectURL = revokeMock;

    const url = createManagedObjectURL({} as any, 'test');
    expect(url.startsWith('blob:')).toBe(true);

    // revoke should return true on first call
    expect(revokeManagedObjectURL(url, 'test')).toBe(true);
    // subsequent calls should be no-op (false)
    expect(revokeManagedObjectURL(url, 'test')).toBe(false);

    // 실제 URL API 호출 검증
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(revokeMock).toHaveBeenCalledTimes(1);

    // 원복
    if (originalCreate) G.URL.createObjectURL = originalCreate;
    else delete G.URL.createObjectURL;
    if (originalRevoke) G.URL.revokeObjectURL = originalRevoke;
    else delete G.URL.revokeObjectURL;
  });
});
