import { describe, it, expect, vi } from 'vitest';

// 이 테스트는 모듈 로드시점에 getPreactHooks가 호출되지 않고,
// 컴포넌트 내부에서 지연 접근하는지 확인합니다.

describe('Toolbar/InteractionComponents lazy hooks access', () => {
  it('does not call getPreactHooks at module top-level', async () => {
    // getPreactHooks 모킹: 호출되면 카운트 증가
    const calls = { count: 0 };
    vi.doMock('@/shared/external/vendors', async importOriginal => {
      const actual = await importOriginal<any>();
      return {
        ...actual,
        getPreactHooks: () => {
          calls.count += 1;
          // 최소 구현 훅 모킹
          return {
            useState: (v: any) => [v, vi.fn()],
            useEffect: vi.fn(),
            useRef: (v: any = null) => ({ current: v }),
            useCallback: (fn: any) => fn,
            useMemo: (fn: any) => fn(),
          } as any;
        },
      };
    });

    // 모듈 로드
    await import('@/shared/components/ui/InteractionComponents');

    // top-level에서 호출되지 않았음을 보장 (사용 시점에만 호출되도록 기대)
    expect(calls.count).toBe(0);
  });
});
