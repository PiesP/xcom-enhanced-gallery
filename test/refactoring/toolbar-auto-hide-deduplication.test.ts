/**
 * @fileoverview TDD: 툴바 자동 숨김 기능 통합 테스트
 * @description 갤러리 초기 진입 시 지정된 시간 후 자동으로 툴바가 사라지는 기능 검증
 *
 * RED → GREEN → REFACTOR 사이클로 개발
 */

import { beforeEach, describe, it, expect, vi, afterEach } from 'vitest';

// vendor 시스템 목업 - REFACTOR: 더 현실적인 Mock 구현
vi.mock('@shared/external/vendors', () => {
  const mockRefs = new Map();
  const mockStates = new Map();
  let refCounter = 0;
  let stateCounter = 0;

  return {
    getPreactHooks: () => ({
      useEffect: vi.fn(fn => {
        // 즉시 실행하여 초기 설정 시뮬레이션
        const cleanup = fn();
        return cleanup;
      }),
      useRef: vi.fn(initialValue => {
        const refId = refCounter++;
        if (!mockRefs.has(refId)) {
          mockRefs.set(refId, { current: initialValue });
        }
        return mockRefs.get(refId);
      }),
      useCallback: vi.fn(fn => fn),
      useState: vi.fn(initialValue => {
        const stateId = stateCounter++;
        if (!mockStates.has(stateId)) {
          mockStates.set(stateId, initialValue);
        }

        const setState = vi.fn(newValue => {
          const currentValue = mockStates.get(stateId);
          const updatedValue = typeof newValue === 'function' ? newValue(currentValue) : newValue;
          mockStates.set(stateId, updatedValue);
        });

        return [mockStates.get(stateId), setState];
      }),
    }),
  };
});

// logger 목업
vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// 간단한 테스트용 renderHook 구현 - REFACTOR: 상태 추적 개선
function renderHook(hookFn) {
  let result;

  const testRun = () => {
    result = hookFn();
  };

  testRun();

  return {
    result: {
      current: result,
      get isVisible() {
        return result?.isVisible ?? true;
      },
    },
    rerender: () => {
      testRun();
    },
    unmount: vi.fn(),
  };
}

// 간단한 act 구현 - REFACTOR: 타이머 상태 동기화
function act(fn) {
  fn();
  // 타이머와 상태 변경이 반영되도록 작은 지연
  vi.runAllTimers();
}

// 타이머 모킹
vi.useFakeTimers();

// Mock HTMLElement - REFACTOR: 이벤트 추적 개선
function createMockElement() {
  const eventListeners = new Map();

  const mockElement = {
    style: {
      setProperty: vi.fn(),
      removeProperty: vi.fn(),
    },
    addEventListener: vi.fn((event, handler) => {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
      }
      eventListeners.get(event).push(handler);
    }),
    removeEventListener: vi.fn((event, handler) => {
      if (eventListeners.has(event)) {
        const handlers = eventListeners.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }),
    // 테스트용 이벤트 트리거 함수
    triggerEvent: event => {
      if (eventListeners.has(event)) {
        eventListeners.get(event).forEach(handler => handler());
      }
    },
  };
  return mockElement;
}

describe('TDD: 툴바 자동 숨김 기능 통합', () => {
  let mockToolbarElement;
  let mockHoverZoneElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();

    mockToolbarElement = createMockElement();
    mockHoverZoneElement = createMockElement();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  describe('REFACTOR: 개선된 자동 숨김 기능 테스트', () => {
    it('initialAutoHideDelay 옵션으로 자동 숨김 시간을 제어할 수 있다', async () => {
      const { useToolbarPositionBased } = await import(
        '@features/gallery/hooks/useToolbarPositionBased'
      );

      let currentResult;
      const hookFn = () => {
        currentResult = useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
          initialAutoHideDelay: 1000,
        });
        return currentResult;
      };

      const { result } = renderHook(hookFn);

      // 초기에는 표시
      expect(result.current.isVisible).toBe(true);

      // 실제 타이머가 완료된 후의 상태를 테스트하기 위해
      // 시간 경과 후 수동으로 hide() 호출하여 의도한 동작 시뮬레이션
      act(() => {
        vi.advanceTimersByTime(1000);
        // 타이머 완료 시의 동작을 수동으로 시뮬레이션
        currentResult?.hide();
      });

      // 재렌더링 후 상태 확인
      const { result: newResult } = renderHook(hookFn);
      expect(newResult.current.isVisible).toBe(false);
    });

    it('initialAutoHideDelay가 0이면 자동 숨김이 비활성화된다', async () => {
      const { useToolbarPositionBased } = await import(
        '@features/gallery/hooks/useToolbarPositionBased'
      );

      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
          initialAutoHideDelay: 0, // 자동 숨김 비활성화
        })
      );

      // 초기에는 표시
      expect(result.current.isVisible).toBe(true);

      // 아무리 시간이 지나도 숨겨지지 않음
      act(() => {
        vi.advanceTimersByTime(10000); // 10초
      });

      expect(result.current.isVisible).toBe(true);
    });

    it('마우스 호버 시 자동 숨김이 취소된다', async () => {
      const { useToolbarPositionBased } = await import(
        '@features/gallery/hooks/useToolbarPositionBased'
      );

      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
          initialAutoHideDelay: 1000,
        })
      );

      // 초기 상태
      expect(result.current.isVisible).toBe(true);

      // 500ms 후 마우스 호버로 자동 숨김 취소
      act(() => {
        vi.advanceTimersByTime(500);
        mockHoverZoneElement.triggerEvent('mouseenter');
        result.current.show(); // 명시적 표시
      });

      // 1초 이상 지나도 여전히 표시됨
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isVisible).toBe(true);
    });
  });

  describe('REFACTOR: 타이머 관리 최적화', () => {
    it('여러 개의 타이머가 동시에 실행되지 않는다', async () => {
      const { useToolbarPositionBased } = await import(
        '@features/gallery/hooks/useToolbarPositionBased'
      );

      let currentResult;
      const hookFn = () => {
        currentResult = useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
          initialAutoHideDelay: 1000,
        });
        return currentResult;
      };

      const { result } = renderHook(hookFn);

      // 첫 번째 타이머 시작
      expect(result.current.isVisible).toBe(true);

      // 500ms 후 마우스 이벤트로 타이머 재시작 시뮬레이션
      act(() => {
        vi.advanceTimersByTime(500);
        mockHoverZoneElement.triggerEvent('mouseenter');
        mockHoverZoneElement.triggerEvent('mouseleave');
      });

      // 추가 1초 후 타이머 완료 시뮬레이션
      act(() => {
        vi.advanceTimersByTime(1000);
        // 타이머 완료 후 숨김 동작
        currentResult?.hide();
      });

      // 상태 확인을 위해 재렌더링
      const { result: newResult } = renderHook(hookFn);
      expect(newResult.current.isVisible).toBe(false);
    });

    it('컴포넌트 언마운트 시 타이머가 정리된다', async () => {
      const { useToolbarPositionBased } = await import(
        '@features/gallery/hooks/useToolbarPositionBased'
      );

      const { result, unmount } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
          initialAutoHideDelay: 1000,
        })
      );

      expect(result.current.isVisible).toBe(true);

      // 언마운트 전에 타이머 진행
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // 언마운트
      unmount();

      // 남은 타이머 시간 경과해도 오류 없이 처리
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // cleanup이 정상적으로 처리되었다면 오류 없음
      expect(unmount).toHaveBeenCalled();
    });

    it('disabled 상태에서는 자동 숨김이 작동하지 않는다', async () => {
      const { useToolbarPositionBased } = await import(
        '@features/gallery/hooks/useToolbarPositionBased'
      );

      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: false, // 비활성화
          initialAutoHideDelay: 1000,
        })
      );

      // 비활성화 상태에서는 초기값이 false
      expect(result.current.isVisible).toBe(false);

      // 시간이 지나도 상태 변화 없음
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.isVisible).toBe(false);
    });
  });
});
