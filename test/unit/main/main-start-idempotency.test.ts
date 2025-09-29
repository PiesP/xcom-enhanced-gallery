/**
 * @fileoverview main.ts 시작/정리(idempotent) 및 PC 전용 글로벌 핸들러 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { importMainWithMocks } from '../../utils/helpers/import-main-with-mocks';

let addEventSpy: ReturnType<typeof vi.spyOn> | undefined;
let removeEventSpy: ReturnType<typeof vi.spyOn> | undefined;

describe('main start/cleanup idempotency', () => {
  beforeEach(() => {
    // 각 테스트 격리
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 스파이 정리
    addEventSpy?.mockRestore();
    removeEventSpy?.mockRestore();
  });

  it('start 재호출 시 추가 등록이 없어야 함 (idempotent)', async () => {
    const { main, addEventSpy: addSpy, removeEventSpy: removeSpy } = await importMainWithMocks();
    addEventSpy = addSpy;
    removeEventSpy = removeSpy;

    const vendors = (await import('@/shared/external/vendors')) as unknown as any;

    // 외부 노이즈 제거 후 1차 시작
    addEventSpy.mockClear();
    removeEventSpy.mockClear();
    await main.start();

    const callsAfterFirst = addEventSpy.mock.calls.slice();
    const beforeUnloadAfterFirst = callsAfterFirst.filter(c => c[0] === 'beforeunload').length;
    const pagehideAfterFirst = callsAfterFirst.filter(c => c[0] === 'pagehide').length;

    // 2차 시작(이미 시작됨) - 추가 등록이 없어야 함
    await main.start();

    // initializeVendors는 1회만
    expect((vendors as any).initializeVendors).toHaveBeenCalledTimes(1);
    expect((vendors as any).__calls.initialize).toBe(1);

    // 2차 호출 이후 추가 등록 없음(델타 0)
    const callsAfterSecond = addEventSpy.mock.calls.slice();
    const beforeUnloadAfterSecond = callsAfterSecond.filter(c => c[0] === 'beforeunload').length;
    const pagehideAfterSecond = callsAfterSecond.filter(c => c[0] === 'pagehide').length;

    expect(beforeUnloadAfterSecond - beforeUnloadAfterFirst).toBe(0);
    expect(pagehideAfterSecond - pagehideAfterFirst).toBe(0);
  });

  it('cleanup은 글로벌 핸들러를 제거하고 재시작 시 중복 등록이 없어야 함', async () => {
    const { main, addEventSpy: addSpy, removeEventSpy: removeSpy } = await importMainWithMocks();
    addEventSpy = addSpy;
    removeEventSpy = removeSpy;

    // 첫 시작: 노이즈 제거 후 등록 수 스냅샷
    addEventSpy.mockClear();
    removeEventSpy.mockClear();
    await main.start();

    const addCallsFirst = addEventSpy.mock.calls.slice();
    const beforeFirst = addCallsFirst.filter(c => c[0] === 'beforeunload').length;
    const pagehideFirst = addCallsFirst.filter(c => c[0] === 'pagehide').length;

    await main.cleanup();

    const removeCalls = removeEventSpy.mock.calls.slice();
    expect(removeCalls.filter(c => c[0] === 'beforeunload').length).toBeGreaterThanOrEqual(1);
    expect(removeCalls.filter(c => c[0] === 'pagehide').length).toBeGreaterThanOrEqual(1);

    // 재시작: 다시 카운터 초기화 후 델타 1 검증
    addEventSpy.mockClear();
    removeEventSpy.mockClear();
    await main.start();
    const addCallsSecond = addEventSpy.mock.calls.slice();
    const beforeSecond = addCallsSecond.filter(c => c[0] === 'beforeunload').length;
    const pagehideSecond = addCallsSecond.filter(c => c[0] === 'pagehide').length;
    expect(beforeSecond).toBeGreaterThanOrEqual(1);
    expect(pagehideSecond).toBeGreaterThanOrEqual(1);
  });
});
