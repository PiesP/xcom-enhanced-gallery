import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createManagedObjectURL,
  releaseAllResources,
  getResourceCount,
} from '@/shared/utils/memory';

/**
 * Epic C: 메모리/리소스 — 대량 썸네일 로딩 스모크
 * - Object URL을 대량 생성 후 모두 해제되었는지(리소스 카운트 0) 검증
 * - URL.revokeObjectURL이 정확히 호출되는지 가드
 */
describe('memory smoke: bulk thumbnail object URLs', () => {
  const G: any = globalThis as any;
  const COUNT = 250;
  let originalCreate: any;
  let originalRevoke: any;
  const createMock = vi.fn<string, any[]>(i => `blob:thumb-${i}`);
  const revokeMock = vi.fn();

  beforeEach(() => {
    // URL API 스텁 준비
    if (!G.URL) {
      G.URL = function URLCtor() {} as any;
    }
    originalCreate = G.URL.createObjectURL;
    originalRevoke = G.URL.revokeObjectURL;
    G.URL.createObjectURL = createMock as any;
    G.URL.revokeObjectURL = revokeMock as any;

    createMock.mockClear();
    revokeMock.mockClear();
  });

  afterEach(() => {
    // 원복
    if (originalCreate) G.URL.createObjectURL = originalCreate;
    else delete G.URL.createObjectURL;
    if (originalRevoke) G.URL.revokeObjectURL = originalRevoke;
    else delete G.URL.revokeObjectURL;
    // 잔여 리소스 방어적 정리
    releaseAllResources();
  });

  it('creates many object URLs and releases all resources back to zero', () => {
    // 대량 생성
    const urls: string[] = [];
    for (let i = 0; i < COUNT; i++) {
      const url = createManagedObjectURL({} as any, `thumb-${i}`);
      urls.push(url);
    }

    // 생성 호출 횟수 확인
    expect(createMock).toHaveBeenCalledTimes(COUNT);
    expect(getResourceCount()).toBe(COUNT);

    // 전체 해제 (갤러리 언마운트에 해당)
    releaseAllResources();

    // 해제 후 리소스 카운트 0
    expect(getResourceCount()).toBe(0);
    // revoke는 1:1 호출
    expect(revokeMock).toHaveBeenCalledTimes(COUNT);

    // 멱등성 확인: 재해제 시 변화 없음
    releaseAllResources();
    expect(getResourceCount()).toBe(0);
    expect(revokeMock).toHaveBeenCalledTimes(COUNT);
  });
});
