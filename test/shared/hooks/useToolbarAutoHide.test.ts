/**
 * @fileoverview useToolbarAutoHide 훅 테스트
 * @version 1.0.0 - 툴바 자동 숨김 기능 TDD 구현
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { renderHook, act } from '@testing-library/preact';

// 모킹 설정
vi.mock('@shared/external/vendors', () => ({
  getPreactHooks: () => ({
    useEffect: (cb, deps) => {
      // 즉시 실행하여 useEffect 동작 시뮬레이션
      cb();
    },
    useRef: initialValue => ({ current: initialValue }),
    useCallback: cb => cb,
    useMemo: cb => cb(),
  }),
  getPreactSignals: () => ({
    signal: initialValue => ({
      value: initialValue,
    }),
  }),
}));

vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// 테스트 후 동적 import 사용
describe.skip('useToolbarAutoHide', () => {
  let useToolbarAutoHide;
  let mockElement;
  let container;

  beforeAll(async () => {
    // 동적 import로 훅 가져오기
    const module = await import('@shared/hooks/useToolbarAutoHide');
    useToolbarAutoHide = module.useToolbarAutoHide;
  });

  beforeEach(() => {
    // DOM 요소 모킹
    const createMockElement = () => ({
      style: {
        opacity: '1',
        transform: 'translateY(0)',
        pointerEvents: 'auto',
        visibility: 'visible',
        setProperty: vi.fn(),
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      contains: vi.fn().mockReturnValue(false),
      setAttribute: vi.fn(),
      appendChild: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    container = createMockElement();
    container.setAttribute('data-testid', 'gallery-container');

    mockElement = createMockElement();
    mockElement.setAttribute('data-testid', 'toolbar-wrapper');
    mockElement.className = 'toolbarWrapper';

    // document와 window 모킹
    global.document = {
      activeElement: null,
      createElement: vi.fn().mockReturnValue(createMockElement()),
      body: {
        innerHTML: '',
        appendChild: vi.fn(),
      },
    } as any;

    global.window = {
      setTimeout: vi.fn((cb: () => void) => {
        cb();
        return 1;
      }),
      clearTimeout: vi.fn(),
    } as any;

    // 타이머 모킹
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('초기 상태', () => {
    it('툴바가 처음에는 표시되어야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarAutoHide({
          toolbarElement: mockElement,
          initialDelay: 3000,
          enabled: true,
        })
      );

      expect(result.current.isVisible).toBe(true);
      expect(result.current.isAutoHideActive).toBe(false);
    });

    it('disabled 상태에서는 자동 숨김이 활성화되지 않아야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarAutoHide({
          toolbarElement: mockElement,
          initialDelay: 3000,
          enabled: false,
        })
      );

      expect(result.current.isAutoHideActive).toBe(false);

      // 시간이 지나도 상태 변화 없음
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.isVisible).toBe(true);
      expect(result.current.isAutoHideActive).toBe(false);
    });
  });

  describe('자동 숨김 타이머', () => {
    it('설정된 시간 후에 툴바가 숨겨져야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarAutoHide({
          toolbarElement: mockElement,
          initialDelay: 3000,
          enabled: true,
        })
      );

      // 초기 상태 확인
      expect(result.current.isVisible).toBe(true);
      expect(result.current.isAutoHideActive).toBe(false);

      // 3초 후 자동 숨김 활성화
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.isAutoHideActive).toBe(true);
    });

    it('커스텀 딜레이 시간이 적용되어야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarAutoHide({
          toolbarElement: mockElement,
          initialDelay: 500,
          enabled: true,
        })
      );

      // 300ms 후에는 아직 숨겨지지 않음
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current.isVisible).toBe(true);

      // 500ms 후에 숨겨짐
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('수동 제어', () => {
    it('수동으로 툴바를 표시할 수 있어야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarAutoHide({
          toolbarElement: mockElement,
          initialDelay: 1000,
          enabled: true,
        })
      );

      // 자동 숨김 활성화
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.isVisible).toBe(false);

      // 수동 표시
      act(() => {
        result.current.show();
      });

      expect(result.current.isVisible).toBe(true);
    });

    it('수동으로 툴바를 숨길 수 있어야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarAutoHide({
          toolbarElement: mockElement,
          initialDelay: 3000,
          enabled: true,
        })
      );

      expect(result.current.isVisible).toBe(true);

      // 수동 숨김
      act(() => {
        result.current.hide();
      });

      expect(result.current.isVisible).toBe(false);
    });

    it('수동으로 자동 숨김을 재시작할 수 있어야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarAutoHide({
          toolbarElement: mockElement,
          initialDelay: 1000,
          enabled: true,
        })
      );

      // 수동으로 표시 후 자동 숨김 재시작
      act(() => {
        result.current.show();
        result.current.restart();
      });

      expect(result.current.isVisible).toBe(true);

      // 지정된 시간 후 자동 숨김
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('CSS 스타일 적용', () => {
    it('툴바가 숨겨질 때 적절한 스타일이 적용되어야 한다', () => {
      renderHook(() =>
        useToolbarAutoHide({
          toolbarElement: mockElement,
          initialDelay: 1000,
          enabled: true,
        })
      );

      // 자동 숨김 활성화
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // setProperty 호출 확인
      expect(mockElement.style.setProperty).toHaveBeenCalledWith('opacity', '0', 'important');
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'pointer-events',
        'none',
        'important'
      );
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'transform',
        'translateY(-100%)',
        'important'
      );
    });

    it('툴바가 표시될 때 적절한 스타일이 적용되어야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarAutoHide({
          toolbarElement: mockElement,
          initialDelay: 1000,
          enabled: true,
        })
      );

      // 숨김 후 다시 표시
      act(() => {
        vi.advanceTimersByTime(1000);
        result.current.show();
      });

      // setProperty 호출 확인
      expect(mockElement.style.setProperty).toHaveBeenCalledWith('opacity', '1', 'important');
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'pointer-events',
        'auto',
        'important'
      );
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'transform',
        'translateY(0)',
        'important'
      );
    });
  });

  describe('메모리 정리', () => {
    it('컴포넌트 언마운트 시 타이머와 이벤트가 정리되어야 한다', () => {
      const { unmount } = renderHook(() =>
        useToolbarAutoHide({
          toolbarElement: mockElement,
          initialDelay: 1000,
          enabled: true,
        })
      );

      unmount();

      // 이벤트 리스너가 정리되었는지 확인
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'mouseenter',
        expect.any(Function)
      );
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'mouseleave',
        expect.any(Function)
      );
    });
  });
});
