/**
 * @fileoverview TDD RED: component-manager 훅 초기화 지연(lazy) 검증
 * 목표:
 * 1) 모듈 임포트 시점에 getPreactHooks가 호출되지 않아야 함 (벤더 미초기화 안전)
 * 2) 실제로 훅을 요청할 때(getHookManager) 최초 1회만 호출되어야 함
 */

import { describe, it, expect, vi } from 'vitest';

// vendors 모듈의 getPreactHooks를 스파이/모킹하여 호출 시점을 추적
vi.mock('@shared/external/vendors', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    getPreactHooks: vi.fn(() => ({
      // 최소 훅 셋만 제공 (타입 호환용)
      useState: vi.fn(),
      useEffect: vi.fn(),
      useMemo: vi.fn(),
      useCallback: vi.fn(),
      useRef: vi.fn(),
      useContext: vi.fn(),
      useReducer: vi.fn(),
      useLayoutEffect: vi.fn(),
    })),
  };
});

describe('TDD: component-manager 훅 초기화 지연', () => {
  it('RED: 모듈 임포트 시 getPreactHooks가 호출되지 않아야 한다', async () => {
    const vendors = await import('@shared/external/vendors');
    const spy = vendors.getPreactHooks as unknown as jest.Mock;

    // Act: component-manager 임포트 (현재는 생성자에서 즉시 호출될 수 있음)
    await import('../../src/shared/components/component-manager');

    // Expect: 임포트 시점에는 호출되지 않아야 함 (현재 구현은 호출되므로 실패 예상)
    expect(spy).not.toHaveBeenCalled();
  });

  it('RED: getHookManager 호출 시 최초 1회만 getPreactHooks가 호출되어야 한다', async () => {
    const vendors = await import('@shared/external/vendors');
    const spy = vendors.getPreactHooks as unknown as jest.Mock;
    spy.mockClear();

    const cm = await import('../../src/shared/components/component-manager');
    const { UnifiedComponentManager } = cm as unknown as {
      UnifiedComponentManager: { getHookManager(): unknown };
    };

    // 아직 호출되지 않음
    expect(spy).not.toHaveBeenCalled();

    // 최초 접근 시 1회 호출
    UnifiedComponentManager.getHookManager();
    expect(spy).toHaveBeenCalledTimes(1);

    // 재접근 시 추가 호출 없음 (캐시/지연 초기화 유지)
    UnifiedComponentManager.getHookManager();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
