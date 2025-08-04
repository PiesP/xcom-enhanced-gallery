/**
 * 통합 툴바 가시성 훅 테스트
 * @description TDD 방식으로 툴바 가시성 제어 통합
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToolbarVisibility } from '@shared/hooks/useToolbarVisibility';

// Mock getPreactHooks for testing
vi.mock('@shared/external/vendors', () => ({
  getPreactHooks: () => ({
    useState: vi.fn().mockImplementation(initial => {
      let state = initial;
      const setState = vi.fn(newState => {
        state = typeof newState === 'function' ? newState(state) : newState;
      });
      return [state, setState];
    }),
    useRef: vi.fn().mockImplementation(initial => ({ current: initial })),
    useEffect: vi.fn().mockImplementation(effect => {
      effect();
    }),
    useCallback: vi.fn().mockImplementation(callback => callback),
  }),
}));

describe('useToolbarVisibility - 통합 툴바 가시성 제어', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('초기 상태', () => {
    it('초기에는 툴바가 표시되어야 한다', () => {
      const { result } = renderHook(() => useToolbarVisibility({ initialShowDuration: 1000 }));

      expect(result.current.isVisible).toBe(true);
    });

    it('지정된 시간 후 자동으로 숨겨져야 한다', () => {
      const { result } = renderHook(() => useToolbarVisibility({ initialShowDuration: 1000 }));

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('호버 존 상호작용', () => {
    it('호버 존에 마우스 진입 시 툴바가 표시되어야 한다', () => {
      const { result } = renderHook(() => useToolbarVisibility());

      // 초기 자동 숨김 후
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.isVisible).toBe(false);

      // 호버 존 진입
      const mockHoverZone = document.createElement('div');
      result.current.hoverZoneRef.current = mockHoverZone;

      act(() => {
        const event = new MouseEvent('mouseenter', { bubbles: true });
        mockHoverZone.dispatchEvent(event);
      });

      expect(result.current.isVisible).toBe(true);
    });

    it('호버 존에서 마우스 이탈 시 툴바가 숨겨져야 한다', () => {
      const { result } = renderHook(() => useToolbarVisibility({ hideDelay: 500 }));

      const mockHoverZone = document.createElement('div');
      result.current.hoverZoneRef.current = mockHoverZone;

      // 호버 진입
      act(() => {
        const enterEvent = new MouseEvent('mouseenter', { bubbles: true });
        mockHoverZone.dispatchEvent(enterEvent);
      });
      expect(result.current.isVisible).toBe(true);

      // 호버 이탈
      act(() => {
        const leaveEvent = new MouseEvent('mouseleave', { bubbles: true });
        mockHoverZone.dispatchEvent(leaveEvent);
      });

      // 딜레이 후 숨김
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('수동 제어', () => {
    it('showToolbar 호출 시 즉시 표시되어야 한다', () => {
      const { result } = renderHook(() => useToolbarVisibility());

      // 자동 숨김 후
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.isVisible).toBe(false);

      // 수동 표시
      act(() => {
        result.current.showToolbar();
      });

      expect(result.current.isVisible).toBe(true);
    });

    it('hideToolbar 호출 시 즉시 숨겨져야 한다', () => {
      const { result } = renderHook(() => useToolbarVisibility());

      expect(result.current.isVisible).toBe(true);

      // 수동 숨김
      act(() => {
        result.current.hideToolbar();
      });

      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('메모리 관리', () => {
    it('컴포넌트 언마운트 시 타이머가 정리되어야 한다', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      const { unmount } = renderHook(() => useToolbarVisibility());

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('컴포넌트 언마운트 시 이벤트 리스너가 정리되어야 한다', () => {
      const removeEventListenerSpy = vi.spyOn(EventTarget.prototype, 'removeEventListener');

      const { result, unmount } = renderHook(() => useToolbarVisibility());

      const mockHoverZone = document.createElement('div');
      result.current.hoverZoneRef.current = mockHoverZone;

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseenter', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    });
  });
});
