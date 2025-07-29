/**
 * 툴바 마우스 위치 기반 통합 로직 테스트
 *
 * 요구사항:
 * 1. 타이머 기반 로직 완전 제거
 * 2. 마우스 위치에만 의존하는 즉시 반응형 시스템
 * 3. 코드 간소화 및 일관성 확보
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useToolbarPositionBased } from '@features/gallery/hooks/useToolbarPositionBased';

// Mock 설정
vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// DOM 모킹
function createMockElement() {
  const element = document.createElement('div');
  const mockSetProperty = vi.fn();

  Object.defineProperty(element.style, 'setProperty', {
    value: mockSetProperty,
    writable: true,
  });

  // @ts-ignore
  element.mockSetProperty = mockSetProperty;
  element.addEventListener = vi.fn();
  element.removeEventListener = vi.fn();

  return element;
}

describe('툴바 마우스 위치 기반 통합 시스템', () => {
  let mockToolbarElement;
  let mockHoverZoneElement;
  let mockDocumentSetProperty;

  beforeEach(() => {
    vi.clearAllMocks();
    mockToolbarElement = createMockElement();
    mockHoverZoneElement = createMockElement();

    // document.documentElement.style.setProperty 모킹
    mockDocumentSetProperty = vi.fn();
    Object.defineProperty(document.documentElement.style, 'setProperty', {
      value: mockDocumentSetProperty,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('즉시 반응형 마우스 위치 기반 제어', () => {
    it('마우스가 호버 존에 진입하면 즉시 툴바가 표시되어야 함', () => {
      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
        })
      );

      // 호버 존 mouseenter 이벤트 시뮬레이션
      const mouseEnterHandler = mockHoverZoneElement.addEventListener.mock.calls.find(
        call => call[0] === 'mouseenter'
      )?.[1];

      act(() => {
        mouseEnterHandler?.();
      });

      expect(result.current.isVisible).toBe(true);
      expect(mockDocumentSetProperty).toHaveBeenCalledWith('--toolbar-opacity', '1');
      expect(mockDocumentSetProperty).toHaveBeenCalledWith('--toolbar-pointer-events', 'auto');
    });

    it('마우스가 호버 존에서 벗어나면 즉시 툴바가 숨겨져야 함', () => {
      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
        })
      );

      // 먼저 표시 상태로 만들기
      act(() => {
        result.current.show();
      });

      // 호버 존 mouseleave 이벤트 시뮬레이션
      const mouseLeaveHandler = mockHoverZoneElement.addEventListener.mock.calls.find(
        call => call[0] === 'mouseleave'
      )?.[1];

      act(() => {
        mouseLeaveHandler?.();
      });

      expect(result.current.isVisible).toBe(false);
      expect(mockDocumentSetProperty).toHaveBeenCalledWith('--toolbar-opacity', '0');
      expect(mockDocumentSetProperty).toHaveBeenCalledWith('--toolbar-pointer-events', 'none');
    });

    it('툴바 자체에 마우스가 있을 때는 표시 상태를 유지해야 함', () => {
      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
        })
      );

      // 툴바 mouseenter 이벤트 시뮬레이션
      const toolbarMouseEnterHandler = mockToolbarElement.addEventListener.mock.calls.find(
        call => call[0] === 'mouseenter'
      )?.[1];

      act(() => {
        toolbarMouseEnterHandler?.();
      });

      expect(result.current.isVisible).toBe(true);
    });
  });

  describe('타이머 로직 제거 검증', () => {
    it('setTimeout, clearTimeout 등 타이머 함수가 사용되지 않아야 함', () => {
      const originalSetTimeout = global.setTimeout;
      const originalClearTimeout = global.clearTimeout;

      const mockSetTimeout = vi.fn();
      const mockClearTimeout = vi.fn();

      global.setTimeout = mockSetTimeout;
      global.clearTimeout = mockClearTimeout;

      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
        })
      );

      // 마우스 이벤트들 시뮬레이션
      const mouseEnterHandler = mockHoverZoneElement.addEventListener.mock.calls.find(
        call => call[0] === 'mouseenter'
      )?.[1];

      const mouseLeaveHandler = mockHoverZoneElement.addEventListener.mock.calls.find(
        call => call[0] === 'mouseleave'
      )?.[1];

      act(() => {
        mouseEnterHandler?.();
      });

      act(() => {
        mouseLeaveHandler?.();
      });

      // 타이머 함수들이 호출되지 않았는지 확인
      expect(mockSetTimeout).not.toHaveBeenCalled();
      expect(mockClearTimeout).not.toHaveBeenCalled();

      // 복원
      global.setTimeout = originalSetTimeout;
      global.clearTimeout = originalClearTimeout;
    });

    it('지연 없이 즉시 상태 변경이 일어나야 함', () => {
      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
        })
      );

      const initialVisible = result.current.isVisible;

      // 즉시 show/hide 테스트
      act(() => {
        result.current.show();
      });
      expect(result.current.isVisible).toBe(true);

      act(() => {
        result.current.hide();
      });
      expect(result.current.isVisible).toBe(false);

      // 상태 변경이 동기적으로 즉시 일어났는지 확인
      expect(result.current.isVisible).not.toBe(initialVisible);
    });
  });

  describe('코드 간소화 검증', () => {
    it('불필요한 상태 관리 로직이 제거되어야 함', () => {
      const { result } = renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: true,
        })
      );

      // 단순한 API만 노출되어야 함
      expect(Object.keys(result.current)).toEqual(['isVisible', 'show', 'hide']);
    });

    it('일관된 CSS 변수 기반 제어가 이루어져야 함', () => {
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

      // CSS 변수를 통한 일관된 스타일 제어 확인
      expect(mockDocumentSetProperty).toHaveBeenCalledWith('--toolbar-opacity', expect.any(String));
      expect(mockDocumentSetProperty).toHaveBeenCalledWith(
        '--toolbar-pointer-events',
        expect.any(String)
      );
    });
  });

  describe('예외 상황 처리', () => {
    it('DOM 요소가 없을 때 graceful degradation이 적용되어야 함', () => {
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

    it('비활성화 상태에서는 이벤트 리스너가 등록되지 않아야 함', () => {
      renderHook(() =>
        useToolbarPositionBased({
          toolbarElement: mockToolbarElement,
          hoverZoneElement: mockHoverZoneElement,
          enabled: false,
        })
      );

      expect(mockHoverZoneElement.addEventListener).not.toHaveBeenCalled();
      expect(mockToolbarElement.addEventListener).not.toHaveBeenCalled();
    });
  });
});
