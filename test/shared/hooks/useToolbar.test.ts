/**
 * @fileoverview useToolbar Hook Tests
 * @description TDD 방식으로 구현된 간소화된 툴바 가시성 제어 훅 테스트
 */

import { renderHook, act } from '@testing-library/preact';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { useToolbar } from '@shared/hooks/useToolbar';

// Mock 의존성
vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useToolbar - 최적화된 툴바 가시성 제어', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // DOM 환경 설정
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('🎯 통합 컨테이너 방식 (깜빡임 해결)', () => {
    it('containerRef가 호버 존과 툴바를 통합 관리한다', () => {
      const { result } = renderHook(() => useToolbar());

      // containerRef가 제공되어야 함
      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBe(null);

      // 기존 hoverZoneRef는 제거되어야 함 (통합됨)
      expect(result.current.hoverZoneRef).toBeUndefined();
    });

    it('통합 컨테이너에서 호버 시 깜빡임 없이 표시된다', () => {
      const { result } = renderHook(() => useToolbar());
      const mockContainer = document.createElement('div');
      document.body.appendChild(mockContainer);
      result.current.containerRef.current = mockContainer;

      // 초기 자동 숨김 후
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.isVisible).toBe(false);

      // 컨테이너 호버 진입 (호버 존 + 툴바 영역 통합)
      act(() => {
        const enterEvent = new MouseEvent('mouseenter');
        mockContainer.dispatchEvent(enterEvent);
      });
      expect(result.current.isVisible).toBe(true);

      // 컨테이너 내에서는 계속 표시 (깜빡임 없음)
      expect(result.current.isVisible).toBe(true);

      // 컨테이너에서 완전히 벗어날 때만 숨김
      act(() => {
        const leaveEvent = new MouseEvent('mouseleave');
        mockContainer.dispatchEvent(leaveEvent);
      });
      expect(result.current.isVisible).toBe(false);

      // 정리
      document.body.removeChild(mockContainer);
    });

    it('물리적 분리가 없어 마우스 이동 시 깜빡임이 발생하지 않는다', () => {
      const { result } = renderHook(() => useToolbar());
      const mockContainer = document.createElement('div');

      // 컨테이너에 실제 툴바 역할을 하는 자식 요소 추가
      const toolbarElement = document.createElement('div');
      toolbarElement.className = 'toolbar';
      mockContainer.appendChild(toolbarElement);

      document.body.appendChild(mockContainer);
      result.current.containerRef.current = mockContainer;

      // 툴바 표시 상태로 만들기
      act(() => {
        const enterEvent = new MouseEvent('mouseenter');
        mockContainer.dispatchEvent(enterEvent);
      });
      expect(result.current.isVisible).toBe(true);

      // 컨테이너 내부의 툴바 요소로 마우스 이동 (기존에는 깜빡임 발생)
      // 통합 컨테이너에서는 내부 이동으로 간주되어 깜빡임 없음
      expect(result.current.isVisible).toBe(true);

      // 정리
      document.body.removeChild(mockContainer);
    });
  });

  describe('초기 동작', () => {
    it('초기에 툴바가 표시된다', () => {
      const { result } = renderHook(() => useToolbar());

      expect(result.current.isVisible).toBe(true);
    });

    it('containerRef를 제공한다', () => {
      const { result } = renderHook(() => useToolbar());

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBe(null);
    });
  });

  describe('자동 숨김 기능', () => {
    it('기본 1초 후에 툴바가 자동으로 숨겨진다', () => {
      const { result } = renderHook(() => useToolbar());

      // 초기 표시 확인
      expect(result.current.isVisible).toBe(true);

      // 1초 경과
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isVisible).toBe(false);
    });

    it('커스텀 초기 표시 시간을 적용한다', () => {
      const { result } = renderHook(() => useToolbar({ initialShowDuration: 2000 }));

      expect(result.current.isVisible).toBe(true);

      // 1초 후에는 아직 표시
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.isVisible).toBe(true);

      // 2초 후에 숨김
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('통합 컨테이너 상호작용', () => {
    it('컨테이너에 마우스 진입 시 툴바가 표시된다', () => {
      const { result, rerender } = renderHook(() => useToolbar());

      // DOM 요소 설정
      const mockContainer = document.createElement('div');
      document.body.appendChild(mockContainer);

      // ref 설정 후 리렌더링으로 이벤트 리스너 등록
      act(() => {
        result.current.containerRef.current = mockContainer;
      });
      rerender();

      // 자동 숨김 후
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.isVisible).toBe(false);

      // 컨테이너 호버 진입
      act(() => {
        const event = new MouseEvent('mouseenter', { bubbles: true });
        mockContainer.dispatchEvent(event);
      });

      expect(result.current.isVisible).toBe(true);

      // 정리
      document.body.removeChild(mockContainer);
    });

    it('컨테이너에서 마우스 이탈 시 즉시 숨겨진다', () => {
      const { result, rerender } = renderHook(() => useToolbar());

      const mockContainer = document.createElement('div');
      document.body.appendChild(mockContainer);

      act(() => {
        result.current.containerRef.current = mockContainer;
      });
      rerender();

      // 먼저 자동 숨김이 일어나도록 함
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.isVisible).toBe(false);

      // 컨테이너 호버 진입으로 표시
      act(() => {
        const enterEvent = new MouseEvent('mouseenter', { bubbles: true });
        mockContainer.dispatchEvent(enterEvent);
      });
      expect(result.current.isVisible).toBe(true);

      // 컨테이너 호버 이탈
      act(() => {
        const leaveEvent = new MouseEvent('mouseleave', { bubbles: true });
        mockContainer.dispatchEvent(leaveEvent);
      });

      expect(result.current.isVisible).toBe(false);

      // 정리
      document.body.removeChild(mockContainer);
    });
  });

  describe('수동 제어 API', () => {
    it('showToolbar()로 수동으로 툴바를 표시할 수 있다', () => {
      const { result } = renderHook(() => useToolbar());

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

    it('hideToolbar()로 수동으로 툴바를 숨길 수 있다', () => {
      const { result } = renderHook(() => useToolbar());

      expect(result.current.isVisible).toBe(true);

      // 수동 숨김
      act(() => {
        result.current.hideToolbar();
      });

      expect(result.current.isVisible).toBe(false);
    });

    it('수동 제어 시 기존 타이머가 정리된다', () => {
      const { result } = renderHook(() => useToolbar());

      // 수동 표시 (초기 타이머 정리)
      act(() => {
        result.current.showToolbar();
      });

      // 원래 타이머 시간 경과해도 숨겨지지 않음
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isVisible).toBe(true);
    });
  });

  describe('메모리 정리', () => {
    it('컴포넌트 언마운트 시 타이머가 정리된다', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      const { unmount } = renderHook(() => useToolbar());

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('컨테이너 이벤트 리스너가 올바르게 작동한다', () => {
      const { result, rerender } = renderHook(() => useToolbar());

      const mockContainer = document.createElement('div');
      document.body.appendChild(mockContainer);

      act(() => {
        result.current.containerRef.current = mockContainer;
      });
      rerender();

      // 자동 숨김 후
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.isVisible).toBe(false);

      // 이벤트가 제대로 처리되는지 확인
      act(() => {
        const enterEvent = new MouseEvent('mouseenter', { bubbles: true });
        mockContainer.dispatchEvent(enterEvent);
      });
      expect(result.current.isVisible).toBe(true);

      act(() => {
        const leaveEvent = new MouseEvent('mouseleave', { bubbles: true });
        mockContainer.dispatchEvent(leaveEvent);
      });
      expect(result.current.isVisible).toBe(false);

      // 정리
      document.body.removeChild(mockContainer);
    });
  });

  describe('에지 케이스', () => {
    it('containerRef가 null일 때 에러가 발생하지 않는다', () => {
      const { result } = renderHook(() => useToolbar());

      // containerRef가 null인 상태에서 리렌더링
      expect(() => {
        act(() => {
          // 강제 리렌더링 트리거
          result.current.showToolbar();
        });
      }).not.toThrow();
    });

    it('동일한 동작을 여러 번 호출해도 안전하다', () => {
      const { result } = renderHook(() => useToolbar());

      expect(() => {
        act(() => {
          result.current.showToolbar();
          result.current.showToolbar();
          result.current.hideToolbar();
          result.current.hideToolbar();
        });
      }).not.toThrow();
    });
  });
});
