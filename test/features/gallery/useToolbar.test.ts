/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview 간소화된 툴바 표시 훅 테스트
 * @description TDD 방식으로 구현된 간소화된 툴바 시스템 테스트
 *
 * 테스트 대상:
 * - 초기 1초간 표시 후 자동 숨김
 * - 상단 호버 존에서 표시/숨김
 * - 단일 상태, 단일 타이머 관리
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useToolbar } from '@features/gallery/hooks/useToolbar';

// Mock external dependencies
vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@shared/external/vendors', () => ({
  getPreactHooks: () => {
    const { useState, useRef, useEffect } = require('preact/hooks');
    return { useState, useRef, useEffect };
  },
}));

describe('useToolbar - TDD 간소화된 구현', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('초기 동작', () => {
    it('초기에 툴바가 표시되어야 한다', () => {
      const { result } = renderHook(() => useToolbar());

      expect(result.current.isVisible).toBe(true);
    });

    it('1초 후 툴바가 자동으로 숨겨져야 한다', () => {
      const { result } = renderHook(() => useToolbar({ initialShowDuration: 1000 }));

      expect(result.current.isVisible).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isVisible).toBe(false);
    });

    it('커스텀 초기 표시 시간을 지원해야 한다', () => {
      const { result } = renderHook(() => useToolbar({ initialShowDuration: 2000 }));

      expect(result.current.isVisible).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.isVisible).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('호버 존 인터랙션', () => {
    it('호버 존 참조를 제공해야 한다', () => {
      const { result } = renderHook(() => useToolbar());

      expect(result.current.hoverZoneRef).toBeDefined();
      expect(result.current.hoverZoneRef.current).toBeNull(); // 초기에는 null
    });

    it('호버 존에 마우스 엔터 시 툴바가 표시되어야 한다', () => {
      const { result } = renderHook(() => useToolbar());

      // 1초 후 자동 숨김
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.isVisible).toBe(false);

      // 가상의 호버 존 엘리먼트 생성
      const mockHoverZone = document.createElement('div');
      result.current.hoverZoneRef.current = mockHoverZone;

      // 마우스 엔터 이벤트 발생
      act(() => {
        const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
        mockHoverZone.dispatchEvent(mouseEnterEvent);
      });

      expect(result.current.isVisible).toBe(true);
    });

    it('호버 존에서 마우스 리브 시 툴바가 숨겨져야 한다', () => {
      const { result } = renderHook(() => useToolbar());

      // 가상의 호버 존 엘리먼트 생성
      const mockHoverZone = document.createElement('div');
      result.current.hoverZoneRef.current = mockHoverZone;

      // 마우스 엔터 후 리브
      act(() => {
        const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
        mockHoverZone.dispatchEvent(mouseEnterEvent);
      });
      expect(result.current.isVisible).toBe(true);

      act(() => {
        const mouseLeaveEvent = new MouseEvent('mouseleave', { bubbles: true });
        mockHoverZone.dispatchEvent(mouseLeaveEvent);
      });

      expect(result.current.isVisible).toBe(false);
    });

    it('호버 중에는 자동 숨김 타이머가 취소되어야 한다', () => {
      const { result } = renderHook(() => useToolbar({ initialShowDuration: 1000 }));

      // 가상의 호버 존 엘리먼트 생성
      const mockHoverZone = document.createElement('div');
      result.current.hoverZoneRef.current = mockHoverZone;

      // 0.5초 후 호버 (1초 전)
      act(() => {
        vi.advanceTimersByTime(500);
        const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
        mockHoverZone.dispatchEvent(mouseEnterEvent);
      });

      // 추가 0.7초 후 (총 1.2초) - 여전히 표시되어야 함
      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(result.current.isVisible).toBe(true);
    });
  });

  describe('타이머 관리', () => {
    it('컴포넌트 언마운트 시 타이머가 정리되어야 한다', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      const { unmount } = renderHook(() => useToolbar());

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('중복 타이머가 발생하지 않아야 한다', () => {
      const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      const { result } = renderHook(() => useToolbar());

      // 가상의 호버 존 엘리먼트 생성
      const mockHoverZone = document.createElement('div');
      result.current.hoverZoneRef.current = mockHoverZone;

      // 여러 번 마우스 엔터 (타이머 중복 방지 확인)
      act(() => {
        const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
        mockHoverZone.dispatchEvent(mouseEnterEvent);
        mockHoverZone.dispatchEvent(mouseEnterEvent);
        mockHoverZone.dispatchEvent(mouseEnterEvent);
      });

      // setTimeout은 초기에 한 번만 호출되어야 함 (초기 자동 숨김용)
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);

      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('옵션 설정', () => {
    it('기본 옵션으로 동작해야 한다', () => {
      const { result } = renderHook(() => useToolbar());

      expect(result.current.isVisible).toBe(true);
      expect(result.current.hoverZoneRef).toBeDefined();
    });

    it('커스텀 호버 존 높이를 설정할 수 있어야 한다', () => {
      const { result } = renderHook(() => useToolbar({ hoverZoneHeight: 150 }));

      // 옵션이 정상적으로 전달되는지 확인 (내부 로직은 테스트하지 않음)
      expect(result.current.hoverZoneRef).toBeDefined();
    });
  });

  describe('성능 최적화', () => {
    it('불필요한 재렌더링을 방지해야 한다', () => {
      let renderCount = 0;

      const { rerender } = renderHook(() => {
        renderCount++;
        return useToolbar();
      });

      const initialRenderCount = renderCount;

      // 동일한 props로 재렌더링
      rerender();

      // 렌더링 횟수가 증가하지 않아야 함 (props가 동일하므로)
      expect(renderCount).toBe(initialRenderCount + 1); // rerender 호출로 인한 1회 증가만
    });
  });
});
