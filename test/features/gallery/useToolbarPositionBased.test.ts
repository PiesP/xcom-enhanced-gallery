/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview 위치 기반 툴바 표시 훅 테스트
 * @description 마우스 위치에 따른 간소화된 툴바 가시성 제어 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useToolbarPositionBased } from '@features/gallery/hooks/useToolbarPositionBased';

// Mock CSS 변수 조작
const mockSetProperty = vi.fn();
const mockDocumentStyle = {
  setProperty: mockSetProperty,
};

Object.defineProperty(document.documentElement, 'style', {
  value: mockDocumentStyle,
  configurable: true,
});

// Mock DOM elements
const createMockElement = () => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  style: {
    setProperty: vi.fn(),
  },
});

describe('useToolbarPositionBased', () => {
  const mockToolbarElement = createMockElement();
  const mockHoverZoneElement = createMockElement();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 동작', () => {
    it('초기 상태에서 툴바가 표시되어야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
        })
      );

      expect(result.current.isVisible).toBe(true);
      expect(mockSetProperty).toHaveBeenCalledWith('--toolbar-opacity', '1');
      expect(mockSetProperty).toHaveBeenCalledWith('--toolbar-pointer-events', 'auto');
    });

    it('비활성화된 상태에서는 툴바가 숨겨져야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: false,
        })
      );

      expect(result.current.isVisible).toBe(false);
      expect(mockSetProperty).toHaveBeenCalledWith('--toolbar-opacity', '0');
      expect(mockSetProperty).toHaveBeenCalledWith('--toolbar-pointer-events', 'none');
    });
  });

  describe('마우스 이벤트 처리', () => {
    it('호버 존에 마우스 엔터 시 툴바가 표시되어야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
        })
      );

      // 이벤트 리스너가 등록되었는지 확인
      expect(mockHoverZoneElement.addEventListener).toHaveBeenCalledWith(
        'mouseenter',
        expect.any(Function)
      );

      // mouseenter 이벤트 시뮬레이션
      const mouseEnterHandler = (mockHoverZoneElement.addEventListener as any).mock.calls.find(
        (call: any) => call[0] === 'mouseenter'
      )?.[1];

      act(() => {
        mouseEnterHandler?.();
      });

      expect(result.current.isVisible).toBe(true);
      expect(mockSetProperty).toHaveBeenCalledWith('--toolbar-opacity', '1');
    });

    it('호버 존에서 마우스 리브 시 툴바가 숨겨져야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
        })
      );

      // mouseleave 이벤트 시뮬레이션
      const mouseLeaveHandler = (mockHoverZoneElement.addEventListener as any).mock.calls.find(
        (call: any) => call[0] === 'mouseleave'
      )?.[1];

      act(() => {
        mouseLeaveHandler?.();
      });

      expect(result.current.isVisible).toBe(false);
      expect(mockSetProperty).toHaveBeenCalledWith('--toolbar-opacity', '0');
    });

    it('툴바 자체에 마우스 엔터 시 표시 상태를 유지해야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
        })
      );

      // 툴바에 mouseenter 이벤트 시뮬레이션
      const toolbarMouseEnterHandler = (mockToolbarElement.addEventListener as any).mock.calls.find(
        (call: any) => call[0] === 'mouseenter'
      )?.[1];

      act(() => {
        toolbarMouseEnterHandler?.();
      });

      expect(result.current.isVisible).toBe(true);
    });
  });

  describe('정리 작업', () => {
    it('컴포넌트 언마운트 시 이벤트 리스너가 제거되어야 한다', () => {
      const { unmount } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
        })
      );

      unmount();

      expect(mockHoverZoneElement.removeEventListener).toHaveBeenCalledWith(
        'mouseenter',
        expect.any(Function)
      );
      expect(mockHoverZoneElement.removeEventListener).toHaveBeenCalledWith(
        'mouseleave',
        expect.any(Function)
      );
      expect(mockToolbarElement.removeEventListener).toHaveBeenCalledWith(
        'mouseenter',
        expect.any(Function)
      );
      expect(mockToolbarElement.removeEventListener).toHaveBeenCalledWith(
        'mouseleave',
        expect.any(Function)
      );
    });
  });

  describe('수동 제어', () => {
    it('show() 호출 시 툴바가 표시되어야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
        })
      );

      act(() => {
        result.current.show();
      });

      expect(result.current.isVisible).toBe(true);
      expect(mockSetProperty).toHaveBeenCalledWith('--toolbar-opacity', '1');
    });

    it('hide() 호출 시 툴바가 숨겨져야 한다', () => {
      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
        })
      );

      act(() => {
        result.current.hide();
      });

      expect(result.current.isVisible).toBe(false);
      expect(mockSetProperty).toHaveBeenCalledWith('--toolbar-opacity', '0');
    });
  });

  describe('엣지 케이스', () => {
    it('엘리먼트가 null일 때 오류없이 동작해야 한다', () => {
      expect(() => {
        renderHook(() =>
          useToolbarPositionBased({
            toolbarElement: null,
            hoverZoneElement: null,
            enabled: true,
          })
        );
      }).not.toThrow();
    });

    it('enabled가 false에서 true로 변경될 때 이벤트 리스너가 추가되어야 한다', () => {
      let enabled = false;
      const { rerender } = renderHook(props => useToolbarPositionBased(props), {
        initialProps: {
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled,
        },
      });

      // 초기에는 이벤트 리스너가 없음
      expect(mockHoverZoneElement.addEventListener).not.toHaveBeenCalled();

      // enabled를 true로 변경
      enabled = true;
      rerender({
        toolbarElement: mockToolbarElement,
        hoverZoneElement: mockHoverZoneElement,
        enabled,
      });

      // 이제 이벤트 리스너가 추가됨
      expect(mockHoverZoneElement.addEventListener).toHaveBeenCalled();
    });
  });
});
