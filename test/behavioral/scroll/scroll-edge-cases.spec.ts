/**
 * @fileoverview ScrollCoordinator Edge Cases 및 Fallback 테스트 (SR-6)
 * 목적: IntersectionObserver 미지원, 타겟 요소 소실 등의 edge case 처리 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupVendorMocks, cleanupVendorMocks } from '../../utils/mocks/vendor-mocks-clean';

describe('ScrollCoordinator Edge Cases', () => {
  beforeEach(() => {
    setupVendorMocks();

    // 기본 환경 설정
    if (typeof globalThis.window === 'undefined') {
      (globalThis as any).window = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        scrollX: 0,
        scrollY: 0,
        innerHeight: 600,
        dispatchEvent: vi.fn(),
      };
    }

    if (typeof globalThis.document === 'undefined') {
      (globalThis as any).document = {
        documentElement: {
          scrollHeight: 1000,
        },
      };
    }
  });

  afterEach(() => {
    cleanupVendorMocks();
    // ScrollCoordinator singleton 상태 초기화는 현재 지원하지 않음
  });

  describe('IntersectionObserver 미지원 환경', () => {
    it('IntersectionObserver가 없을 때 graceful degradation', async () => {
      // IntersectionObserver 제거
      const originalIntersectionObserver = globalThis.IntersectionObserver;
      delete (globalThis as any).IntersectionObserver;

      const { registerIntersection } = await import('@shared/scroll');

      let callbackCalled = false;
      const callback = () => {
        callbackCalled = true;
      };

      if (typeof globalThis.document === 'undefined') {
        (globalThis as any).document = {
          createElement: () => ({ matches: () => false }),
          body: { appendChild: vi.fn(), removeChild: vi.fn() },
        };
      }

      // 경고 메시지 캡처를 위한 console.warn spy
      const warnSpy = vi.spyOn(globalThis.console, 'warn').mockImplementation(() => {});

      // 미지원 환경에서 호출 시 noop 함수 반환되어야 함
      const unobserve = registerIntersection(globalThis.document.createElement('div'), callback);

      expect(typeof unobserve).toBe('function');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('IntersectionObserver not supported')
      );

      // unobserve 호출해도 에러 없어야 함
      expect(() => unobserve()).not.toThrow();
      expect(callbackCalled).toBe(false);

      // 정리
      warnSpy.mockRestore();
      if (originalIntersectionObserver) {
        (globalThis as any).IntersectionObserver = originalIntersectionObserver;
      }
    });

    it('ScrollCoordinator는 IntersectionObserver 없어도 정상 동작', async () => {
      const originalIntersectionObserver = globalThis.IntersectionObserver;
      delete (globalThis as any).IntersectionObserver;

      const { getScrollCoordinator } = await import('@shared/scroll');

      // ScrollCoordinator는 IntersectionObserver와 독립적
      expect(() => {
        const coord = getScrollCoordinator();
        coord.attach();
        expect(coord.position.value).toBeDefined();
        coord.detach();
      }).not.toThrow();

      if (originalIntersectionObserver) {
        (globalThis as any).IntersectionObserver = originalIntersectionObserver;
      }
    });
  });

  describe('타겟 요소 변경 및 소실', () => {
    it('attach 호출 시 타겟이 null이어도 안전', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      const coord = getScrollCoordinator();

      expect(() => {
        coord.attach(null as any);
        coord.detach();
      }).not.toThrow();
    });

    it('DOM에서 제거된 요소를 타겟으로 해도 에러 없음', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      if (typeof globalThis.document === 'undefined') {
        (globalThis as any).document = {
          createElement: () => ({ matches: () => false }),
          body: { appendChild: vi.fn(), removeChild: vi.fn() },
        };
      }

      const element = globalThis.document.createElement('div');
      const coord = getScrollCoordinator();

      // 요소를 DOM에 추가했다가 제거
      globalThis.document.body.appendChild(element);
      coord.attach(element);
      globalThis.document.body.removeChild(element);

      expect(() => {
        coord.detach();
      }).not.toThrow();
    });

    it('window 객체가 없는 환경에서도 안전', async () => {
      const originalWindow = globalThis.window;
      delete (globalThis as any).window;

      const { getScrollCoordinator } = await import('@shared/scroll');

      expect(() => {
        const coord = getScrollCoordinator();
        coord.attach();
        coord.detach();
      }).not.toThrow();

      // window 복원
      (globalThis as any).window = originalWindow;
    });
  });

  describe('재실행 안전성', () => {
    it('coordinator singleton이 올바르게 재사용됨', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      const coord1 = getScrollCoordinator();
      const coord2 = getScrollCoordinator();
      const coord3 = getScrollCoordinator({ idleDelay: 200 });

      // 모든 호출이 동일한 인스턴스 반환
      expect(coord1).toBe(coord2);
      expect(coord2).toBe(coord3);
    });

    it('중복 attach 호출이 안전', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      const coord = getScrollCoordinator();
      const addEventListenerSpy = vi.spyOn(globalThis.window, 'addEventListener');

      coord.attach();
      coord.attach(); // 중복 호출
      coord.attach(); // 또 중복 호출

      // addEventListener는 한 번만 호출되어야 함
      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

      coord.detach();
      addEventListenerSpy.mockRestore();
    });

    it('중복 detach 호출이 안전', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      const coord = getScrollCoordinator();
      const removeEventListenerSpy = vi.spyOn(globalThis.window, 'removeEventListener');

      coord.attach();
      coord.detach();
      coord.detach(); // 중복 detach
      coord.detach(); // 또 중복 detach

      // removeEventListener는 한 번만 호출되어야 함
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('에러 핸들링', () => {
    it('subscriber callback 에러가 다른 구독자에게 영향 없음', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      const coord = getScrollCoordinator();
      coord.attach();

      let callback1Called = false;
      let callback2Called = false;

      // 첫 번째 구독자는 에러 발생
      const unsub1 = coord.subscribe(() => {
        callback1Called = true;
        throw new Error('Test error');
      });

      // 두 번째 구독자는 정상
      const unsub2 = coord.subscribe(() => {
        callback2Called = true;
      });

      // console.warn spy 설정 (에러 로깅 확인용)
      const warnSpy = vi.spyOn(globalThis.console, 'warn').mockImplementation(() => {});

      // 스크롤 이벤트 시뮬레이션
      const scrollEvent = new Event('scroll');
      globalThis.window.dispatchEvent(scrollEvent);

      // rAF 완료 대기
      await new Promise(resolve => globalThis.requestAnimationFrame(resolve));

      // 두 번째 콜백은 호출되어야 함 (첫 번째 에러에 영향받지 않음)
      expect(callback1Called).toBe(true);
      expect(callback2Called).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('subscriber error'),
        expect.any(Error)
      );

      // 정리
      unsub1();
      unsub2();
      coord.detach();
      warnSpy.mockRestore();
    });

    it('잘못된 옵션으로도 안전하게 동작', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      expect(() => {
        // 잘못된 타입의 옵션
        const coord = getScrollCoordinator({ idleDelay: -1 } as any);
        coord.attach();
        coord.detach();
      }).not.toThrow();

      expect(() => {
        // null 옵션
        const coord = getScrollCoordinator(null as any);
        coord.attach();
        coord.detach();
      }).not.toThrow();
    });
  });

  describe('성능 관련 Edge Cases', () => {
    it('빈번한 구독/해제 사이클이 안전', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      const coord = getScrollCoordinator();
      coord.attach();

      // 100번의 구독/해제 사이클
      for (let i = 0; i < 100; i++) {
        const unsub = coord.subscribe(() => {});
        unsub();
      }

      // 여전히 정상 동작해야 함
      let called = false;
      const unsub = coord.subscribe(() => {
        called = true;
      });

      const scrollEvent = new Event('scroll');
      globalThis.window.dispatchEvent(scrollEvent);
      await new Promise(resolve => globalThis.requestAnimationFrame(resolve));

      expect(called).toBe(true);

      unsub();
      coord.detach();
    });

    it('rAF 콜백 중 추가 스크롤 이벤트 발생해도 안전', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      const coord = getScrollCoordinator();
      coord.attach();

      let callbackCount = 0;
      const unsub = coord.subscribe(() => {
        callbackCount++;
        // 콜백 중 추가 스크롤 이벤트 발생
        if (callbackCount === 1) {
          const event = new Event('scroll');
          globalThis.window.dispatchEvent(event);
        }
      });

      // 첫 번째 스크롤 이벤트
      const scrollEvent = new Event('scroll');
      globalThis.window.dispatchEvent(scrollEvent);

      // 두 프레임 대기
      await new Promise(resolve => globalThis.requestAnimationFrame(resolve));
      await new Promise(resolve => globalThis.requestAnimationFrame(resolve));

      // 중복 호출이 적절히 제어되었는지 확인
      expect(callbackCount).toBeGreaterThan(0);
      expect(callbackCount).toBeLessThan(10); // 무한 루프 방지 확인

      unsub();
      coord.detach();
    });
  });
});
