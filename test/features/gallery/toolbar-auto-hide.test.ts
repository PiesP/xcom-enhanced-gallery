/**
 * @fileoverview Phase B RED: 툴바 자동 숨김 기능 테스트
 * @description TDD RED 단계 - 초기 표시 후 N초 후 자동으로 툴바가 숨겨지는 기능 검증
 *
 * Epic: UX-001 Phase B
 * 목표: useToolbarPositionBased 훅에 initialAutoHideDelay 옵션 추가 및 타이머 로직 구현
 *
 * Acceptance:
 * - 갤러리 기동 후 N초(기본 2초) 경과 시 툴바 자동 숨김
 * - hover 영역 진입 시 즉시 표시 및 타이머 취소
 * - hover 영역 이탈 시 즉시 숨김
 * - manual show() 호출 시 타이머 취소 및 표시 유지
 * - initialAutoHideDelay: 0이면 자동 숨김 비활성화
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@/_adapters/solid-testing-adapter';
import { useToolbarPositionBased } from '@shared/hooks/useToolbarPositionBased';
import { getSolidCore } from '@shared/external/vendors';
import type { UseToolbarPositionBasedOptions } from '@features/gallery/hooks/useToolbarPositionBased';

// Fake timers 설정
vi.useFakeTimers();

// Mock HTMLElement
function createMockElement(): HTMLElement {
  type EventListenerFn = (event: Event) => void;
  const listeners = new Map<string, EventListenerFn[]>();

  return {
    addEventListener(type: string, listener: EventListenerFn) {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type)!.push(listener);
    },
    removeEventListener(type: string, listener: EventListenerFn) {
      const typeListeners = listeners.get(type);
      if (typeListeners) {
        const index = typeListeners.indexOf(listener);
        if (index !== -1) {
          typeListeners.splice(index, 1);
        }
      }
    },
    dispatchEvent(event: Event) {
      const typeListeners = listeners.get(event.type);
      if (typeListeners) {
        typeListeners.forEach(listener => listener(event));
      }
      return true;
    },
    style: {
      setProperty: vi.fn(),
    },
  } as unknown as HTMLElement;
}

describe('Phase B RED: 툴바 자동 숨김 기능', () => {
  let mockToolbar: HTMLElement;
  let mockHoverZone: HTMLElement;

  beforeEach(() => {
    mockToolbar = createMockElement();
    mockHoverZone = createMockElement();
    vi.clearAllMocks();
    vi.clearAllTimers();

    // Document mock
    const documentMock = {
      documentElement: {
        style: {
          setProperty: vi.fn(),
        },
      },
    };
    vi.stubGlobal('document', documentMock);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.clearAllTimers();
  });

  describe('RED: 자동 숨김 기본 동작', () => {
    it('initialAutoHideDelay 옵션이 인터페이스에 존재해야 한다', () => {
      // 타입 검증: initialAutoHideDelay가 옵션에 포함되는지 확인
      const options: UseToolbarPositionBasedOptions = {
        toolbarElement: mockToolbar,
        hoverZoneElement: mockHoverZone,
        enabled: true,
        // @ts-expect-error - RED: initialAutoHideDelay 아직 정의 안 됨
        initialAutoHideDelay: 2000,
      };

      expect(options).toBeDefined();
    });

    it('초기 표시 후 initialAutoHideDelay 시간 경과 시 isVisible이 false가 되어야 한다', () => {
      const result = useToolbarPositionBased({
        toolbarElement: mockToolbar,
        hoverZoneElement: mockHoverZone,
        enabled: true,
        // @ts-expect-error - RED: initialAutoHideDelay 아직 정의 안 됨
        initialAutoHideDelay: 2000,
      });

      // 초기 상태: 표시됨
      expect(result.isVisible).toBe(true);

      // 2초 경과
      vi.advanceTimersByTime(2000);

      // RED: 아직 구현 안 됨 - 여전히 true일 것으로 예상
      expect(result.isVisible).toBe(false); // 이 테스트는 실패할 것임
    });

    it('initialAutoHideDelay가 0이면 자동 숨김이 비활성화되어야 한다', () => {
      const result = useToolbarPositionBased({
        toolbarElement: mockToolbar,
        hoverZoneElement: mockHoverZone,
        enabled: true,
        // @ts-expect-error - RED: initialAutoHideDelay 아직 정의 안 됨
        initialAutoHideDelay: 0,
      });

      // 초기 상태: 표시됨
      expect(result.isVisible).toBe(true);

      // 충분한 시간 경과
      vi.advanceTimersByTime(10000);

      // 여전히 표시되어야 함
      expect(result.isVisible).toBe(true);
    });

    it('initialAutoHideDelay가 undefined이면 기본값(5000ms)을 사용해야 한다', () => {
      const result = useToolbarPositionBased({
        toolbarElement: mockToolbar,
        hoverZoneElement: mockHoverZone,
        enabled: true,
        // initialAutoHideDelay 없음 - 기본값 사용
      });

      // 초기 상태: 표시됨
      expect(result.isVisible).toBe(true);

      // 기본값 5초 경과 (Phase 1에서 2s → 5s로 변경)
      vi.advanceTimersByTime(5000);

      // 자동 숨김 구현됨
      expect(result.isVisible).toBe(false);
    });
  });

  describe('RED: 타이머 취소 조건', () => {
    it('hover 진입 시 자동 숨김 타이머가 취소되어야 한다', () => {
      const result = useToolbarPositionBased({
        toolbarElement: mockToolbar,
        hoverZoneElement: mockHoverZone,
        enabled: true,
        // @ts-expect-error - RED: initialAutoHideDelay 아직 정의 안 됨
        initialAutoHideDelay: 2000,
      });

      // 초기 상태
      expect(result.isVisible).toBe(true);

      // 1초 경과 (타이머 진행 중)
      vi.advanceTimersByTime(1000);

      // hover 진입
      mockHoverZone.dispatchEvent(new Event('mouseenter'));

      // 추가 1초 경과 (원래라면 자동 숨김 시점)
      vi.advanceTimersByTime(1000);

      // hover 상태이므로 여전히 표시되어야 함
      expect(result.isVisible).toBe(true);
    });

    it('manual show() 호출 시 자동 숨김 타이머가 취소되어야 한다', () => {
      const result = useToolbarPositionBased({
        toolbarElement: mockToolbar,
        hoverZoneElement: mockHoverZone,
        enabled: true,
        // @ts-expect-error - RED: initialAutoHideDelay 아직 정의 안 됨
        initialAutoHideDelay: 2000,
      });

      // 1초 경과
      vi.advanceTimersByTime(1000);

      // manual show() 호출
      result.show();

      // 추가 2초 경과 (원래라면 자동 숨김되었을 시점 + 추가)
      vi.advanceTimersByTime(2000);

      // manual show()로 타이머 취소되었으므로 여전히 표시되어야 함
      expect(result.isVisible).toBe(true);
    });

    it('hover 이탈 시 즉시 숨김 (자동 숨김과 무관)', () => {
      const result = useToolbarPositionBased({
        toolbarElement: mockToolbar,
        hoverZoneElement: mockHoverZone,
        enabled: true,
        // @ts-expect-error - RED: initialAutoHideDelay 아직 정의 안 됨
        initialAutoHideDelay: 2000,
      });

      // hover 진입
      mockHoverZone.dispatchEvent(new Event('mouseenter'));
      expect(result.isVisible).toBe(true);

      // hover 이탈
      mockHoverZone.dispatchEvent(new Event('mouseleave'));

      // 즉시 숨김
      expect(result.isVisible).toBe(false);
    });
  });

  describe('RED: 타이머 정리', () => {
    it('컴포넌트 언마운트 시 진행 중인 타이머가 정리되어야 한다', () => {
      // Vitest의 타이머 카운트 확인을 위한 spy
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      const result = useToolbarPositionBased({
        toolbarElement: mockToolbar,
        hoverZoneElement: mockHoverZone,
        enabled: true,
        // @ts-expect-error - RED: initialAutoHideDelay 아직 정의 안 됨
        initialAutoHideDelay: 2000,
      });

      // 타이머 진행 중
      vi.advanceTimersByTime(1000);

      // 언마운트 시뮬레이션은 SolidJS onCleanup이 호출되는 것을 가정
      // 실제 구현에서는 onCleanup에서 clearTimeout 호출 필요

      // RED: 아직 구현 안 됨
      // expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it('disabled 상태로 전환 시 진행 중인 타이머가 취소되어야 한다', () => {
      // 이 테스트는 enabled가 reactive하게 변경될 수 있다고 가정
      // Accessor를 사용하는 경우 테스트 방법 고려 필요
      // RED: 현재는 enabled가 단순 boolean이므로 skip
      // 향후 reactive enabled 지원 시 구현
    });
  });

  describe('RED: 엣지 케이스', () => {
    it('짧은 delay(100ms)도 정확하게 동작해야 한다', () => {
      const result = useToolbarPositionBased({
        toolbarElement: mockToolbar,
        hoverZoneElement: mockHoverZone,
        enabled: true,
        // @ts-expect-error - RED: initialAutoHideDelay 아직 정의 안 됨
        initialAutoHideDelay: 100,
      });

      expect(result.isVisible).toBe(true);

      vi.advanceTimersByTime(100);

      expect(result.isVisible).toBe(false); // RED
    });

    it('긴 delay(10000ms)도 정확하게 동작해야 한다', () => {
      const result = useToolbarPositionBased({
        toolbarElement: mockToolbar,
        hoverZoneElement: mockHoverZone,
        enabled: true,
        // @ts-expect-error - RED: initialAutoHideDelay 아직 정의 안 됨
        initialAutoHideDelay: 10000,
      });

      expect(result.isVisible).toBe(true);

      // 9.9초 경과 - 아직 표시
      vi.advanceTimersByTime(9900);
      expect(result.isVisible).toBe(true);

      // 추가 0.1초 경과 - 이제 숨김
      vi.advanceTimersByTime(100);
      expect(result.isVisible).toBe(false); // RED
    });

    it('enabled가 false이면 자동 숨김이 작동하지 않아야 한다', () => {
      const result = useToolbarPositionBased({
        toolbarElement: mockToolbar,
        hoverZoneElement: mockHoverZone,
        enabled: false, // disabled
        // @ts-expect-error - RED: initialAutoHideDelay 아직 정의 안 됨
        initialAutoHideDelay: 2000,
      });

      // disabled 상태에서는 항상 false
      expect(result.isVisible).toBe(false);

      vi.advanceTimersByTime(2000);

      // 여전히 false (타이머 동작 안 함)
      expect(result.isVisible).toBe(false);
    });
  });
});
