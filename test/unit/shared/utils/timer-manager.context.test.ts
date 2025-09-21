import { describe, it, expect, vi } from 'vitest';

describe('TimerManager context-scoped timers', () => {
  it('context 옵션으로 등록한 타이머/인터벌이 컨텍스트별 카운트/정리에 반영된다', async () => {
    vi.resetModules();
    const mod = await import('@/shared/utils/timer-management');
    const { globalTimerManager } = mod as typeof import('@/shared/utils/timer-management');

    // 사전 상태 정리
    globalTimerManager.cleanup();
    expect(globalTimerManager.getActiveTimersCount()).toBe(0);

    const ctxA = 'ctx:A';
    const ctxB = 'ctx:B';

    // A에 타임아웃 2개, 인터벌 1개
    const t1 = globalTimerManager.setTimeout(() => void 0, 50, ctxA);
    const t2 = globalTimerManager.setTimeout(() => void 0, 60, ctxA);
    const i1 = globalTimerManager.setInterval(() => void 0, 1000, ctxA);
    expect(t1).toBeTypeOf('number');
    expect(t2).toBeTypeOf('number');
    expect(i1).toBeTypeOf('number');

    // B에 타임아웃 1개
    const t3 = globalTimerManager.setTimeout(() => void 0, 70, ctxB);
    expect(t3).toBeTypeOf('number');

    expect(globalTimerManager.getActiveTimersCountByContext(ctxA)).toBe(3);
    expect(globalTimerManager.getActiveTimersCountByContext(ctxB)).toBe(1);
    expect(globalTimerManager.getActiveTimersCount()).toBe(4);

    // 컨텍스트 B만 정리
    globalTimerManager.cleanupByContext(ctxB);
    expect(globalTimerManager.getActiveTimersCountByContext(ctxB)).toBe(0);
    expect(globalTimerManager.getActiveTimersCountByContext(ctxA)).toBe(3);

    // A의 하나를 수동 해제
    globalTimerManager.clearTimeout(t1);
    expect(globalTimerManager.getActiveTimersCountByContext(ctxA)).toBe(2);

    // 전체 정리
    globalTimerManager.cleanup();
    expect(globalTimerManager.getActiveTimersCount()).toBe(0);
  });
});
