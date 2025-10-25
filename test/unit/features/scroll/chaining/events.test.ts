/**
 * @description 스크롤 체이닝 이벤트 핸들러 패턴 검증
 * @note preventDefault/stopPropagation을 통한 스크롤 체이닝 방지 패턴 테스트
 * @see CSS overscroll-behavior 기반 실제 구현은 css.test.ts 참고
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Helper function to create wheel events in JSDOM
function createWheelEvent(
  deltaY = 100,
  options: Partial<globalThis.WheelEventInit> = {}
): WheelEvent {
  return new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    deltaY,
    ...options,
  });
}

// Helper function to create keyboard events
function createKeyboardEvent(
  key: string,
  options: Partial<globalThis.KeyboardEventInit> = {}
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
    ...options,
  });
}

describe('Phase 140.5: Scroll Chaining Event Handler Prevention', () => {
  let container: HTMLElement;
  let twitterContainer: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';

    // 트위터 메인 컨테이너 모킹
    twitterContainer = document.createElement('div');
    twitterContainer.setAttribute('data-testid', 'primaryColumn');
    twitterContainer.style.height = '1000px';
    twitterContainer.style.overflow = 'auto';
    document.body.appendChild(twitterContainer);

    // 갤러리 컨테이너
    container = document.createElement('div');
    container.className = 'gallery-container';
    container.style.height = '500px';
    container.style.overflow = 'auto';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('1. Wheel 이벤트 preventDefault', () => {
    it('should prevent default wheel behavior when gallery is open', () => {
      // RED: 갤러리 열린 상태에서 휠 이벤트의 기본 동작 차단
      let defaultPrevented = false;

      const wheelHandler = (event: WheelEvent) => {
        // 갤러리가 열려있다고 가정
        const isGalleryOpen = true;

        if (isGalleryOpen) {
          event.preventDefault();
          defaultPrevented = event.defaultPrevented;
        }
      };

      container.addEventListener('wheel', wheelHandler, { passive: false });

      const wheelEvent = createWheelEvent(100);
      container.dispatchEvent(wheelEvent);

      // 기본 동작이 차단되어야 함
      expect(defaultPrevented).toBe(true);

      container.removeEventListener('wheel', wheelHandler);
    });

    it('should NOT prevent wheel event when gallery is closed', () => {
      // GREEN: 갤러리 닫혀있을 때는 휠 이벤트 차단하지 않음
      let defaultPrevented = false;

      const wheelHandler = (event: WheelEvent) => {
        const isGalleryOpen = false; // 닫혀있음

        if (isGalleryOpen) {
          event.preventDefault();
        }
        defaultPrevented = event.defaultPrevented;
      };

      container.addEventListener('wheel', wheelHandler, { passive: false });

      const wheelEvent = createWheelEvent(100);
      container.dispatchEvent(wheelEvent);

      // 기본 동작이 차단되지 않아야 함
      expect(defaultPrevented).toBe(false);

      container.removeEventListener('wheel', wheelHandler);
    });

    it('should use passive:false for preventable wheel events', () => {
      // RED: preventDefault를 호출하려면 passive:false 필요
      const wheelHandler = vi.fn((event: WheelEvent) => {
        event.preventDefault();
      });

      // passive:false로 리스너 등록
      container.addEventListener('wheel', wheelHandler, { passive: false });

      const wheelEvent = createWheelEvent(100);
      container.dispatchEvent(wheelEvent);

      expect(wheelHandler).toHaveBeenCalledTimes(1);
      expect(wheelEvent.defaultPrevented).toBe(true);

      container.removeEventListener('wheel', wheelHandler);
    });
  });

  describe('2. 이벤트 stopPropagation', () => {
    it('should stop wheel event propagation to parent', () => {
      // RED: 자식 요소의 휠 이벤트가 부모로 전파되지 않도록 차단
      let parentWheelCalled = false;
      let childWheelCalled = false;

      const parentHandler = () => {
        parentWheelCalled = true;
      };

      const childHandler = (event: WheelEvent) => {
        childWheelCalled = true;
        event.stopPropagation(); // 전파 차단
      };

      twitterContainer.addEventListener('wheel', parentHandler);
      container.addEventListener('wheel', childHandler);

      const wheelEvent = createWheelEvent(100);
      container.dispatchEvent(wheelEvent);

      // 자식 핸들러만 호출되고 부모는 호출되지 않아야 함
      expect(childWheelCalled).toBe(true);
      expect(parentWheelCalled).toBe(false);

      twitterContainer.removeEventListener('wheel', parentHandler);
      container.removeEventListener('wheel', childHandler);
    });

    it('should allow event propagation when NOT preventing', () => {
      // GREEN: stopPropagation 호출하지 않으면 전파됨
      let parentWheelCalled = false;
      let childWheelCalled = false;

      const parentHandler = () => {
        parentWheelCalled = true;
      };

      const childHandler = () => {
        childWheelCalled = true;
        // stopPropagation 호출하지 않음
      };

      twitterContainer.addEventListener('wheel', parentHandler);
      container.addEventListener('wheel', childHandler);

      // 자식에서 부모로 버블링
      twitterContainer.appendChild(container);

      const wheelEvent = createWheelEvent(100);
      container.dispatchEvent(wheelEvent);

      // 둘 다 호출되어야 함
      expect(childWheelCalled).toBe(true);
      expect(parentWheelCalled).toBe(true);

      twitterContainer.removeEventListener('wheel', parentHandler);
      container.removeEventListener('wheel', childHandler);
    });
  });

  describe('3. 키보드 네비게이션 preventDefault', () => {
    it('should prevent default for navigation keys when gallery is open', () => {
      // RED: 네비게이션 키(Space, PageUp/Down, etc.)의 기본 스크롤 차단
      const navigationKeys = [
        'Space',
        ' ',
        'PageDown',
        'PageUp',
        'Home',
        'End',
        'ArrowLeft',
        'ArrowRight',
      ];

      navigationKeys.forEach(key => {
        let defaultPrevented = false;

        const keyHandler = (event: KeyboardEvent) => {
          const isGalleryOpen = true;
          const isNavigationKey = navigationKeys.includes(event.key);

          if (isGalleryOpen && isNavigationKey) {
            event.preventDefault();
            defaultPrevented = event.defaultPrevented;
          }
        };

        document.addEventListener('keydown', keyHandler);

        const keyEvent = createKeyboardEvent(key);
        document.dispatchEvent(keyEvent);

        // 각 키의 기본 동작이 차단되어야 함
        expect(defaultPrevented).toBe(true);

        document.removeEventListener('keydown', keyHandler);
      });
    });

    it('should NOT prevent default for non-navigation keys', () => {
      // GREEN: 네비게이션 키가 아닌 경우 차단하지 않음
      const nonNavigationKeys = ['a', 'b', 'Shift', 'Control', 'Alt'];

      nonNavigationKeys.forEach(key => {
        let defaultPrevented = false;

        const keyHandler = (event: KeyboardEvent) => {
          const isGalleryOpen = true;
          const navigationKeys = ['Space', ' ', 'PageDown', 'PageUp', 'Home', 'End'];
          const isNavigationKey = navigationKeys.includes(event.key);

          if (isGalleryOpen && isNavigationKey) {
            event.preventDefault();
          }
          defaultPrevented = event.defaultPrevented;
        };

        document.addEventListener('keydown', keyHandler);

        const keyEvent = createKeyboardEvent(key);
        document.dispatchEvent(keyEvent);

        // 기본 동작이 차단되지 않아야 함
        expect(defaultPrevented).toBe(false);

        document.removeEventListener('keydown', keyHandler);
      });
    });

    it('should prevent ArrowUp/Down for video control only', () => {
      // RED: ArrowUp/Down은 비디오 볼륨 조절에만 사용, 페이지 스크롤 차단
      let defaultPrevented = false;

      const keyHandler = (event: KeyboardEvent) => {
        const isGalleryOpen = true;
        const isVideoKey = ['ArrowUp', 'ArrowDown'].includes(event.key);

        if (isGalleryOpen && isVideoKey) {
          event.preventDefault();
          defaultPrevented = event.defaultPrevented;
        }
      };

      document.addEventListener('keydown', keyHandler);

      const arrowUpEvent = createKeyboardEvent('ArrowUp');
      document.dispatchEvent(arrowUpEvent);

      // 기본 동작(페이지 스크롤) 차단되어야 함
      expect(defaultPrevented).toBe(true);

      document.removeEventListener('keydown', keyHandler);
    });
  });

  describe('4. 트위터 페이지 스크롤 차단', () => {
    it('should block Twitter page scroll when gallery is scrolling', () => {
      // RED: 갤러리 스크롤 중에는 트위터 페이지 스크롤 차단
      let twitterScrollPrevented = false;
      let isScrolling = false;

      const twitterScrollHandler = (event: WheelEvent) => {
        if (isScrolling) {
          event.preventDefault();
          event.stopPropagation();
          twitterScrollPrevented = event.defaultPrevented;
        }
      };

      twitterContainer.addEventListener('wheel', twitterScrollHandler, {
        passive: false,
        capture: true,
      });

      // 갤러리 스크롤 시작
      isScrolling = true;

      const wheelEvent = createWheelEvent(100);
      twitterContainer.dispatchEvent(wheelEvent);

      // 트위터 스크롤이 차단되어야 함
      expect(twitterScrollPrevented).toBe(true);

      twitterContainer.removeEventListener('wheel', twitterScrollHandler, { capture: true } as any);
    });

    it('should allow Twitter page scroll when gallery is NOT scrolling', () => {
      // GREEN: 갤러리가 스크롤 중이 아니면 트위터 페이지 스크롤 허용
      let twitterScrollPrevented = false;
      let isScrolling = false;

      const twitterScrollHandler = (event: WheelEvent) => {
        if (isScrolling) {
          event.preventDefault();
          event.stopPropagation();
        }
        twitterScrollPrevented = event.defaultPrevented;
      };

      twitterContainer.addEventListener('wheel', twitterScrollHandler, {
        passive: false,
        capture: true,
      });

      // 갤러리가 스크롤 중이 아님
      isScrolling = false;

      const wheelEvent = createWheelEvent(100);
      twitterContainer.dispatchEvent(wheelEvent);

      // 트위터 스크롤이 차단되지 않아야 함
      expect(twitterScrollPrevented).toBe(false);

      twitterContainer.removeEventListener('wheel', twitterScrollHandler, { capture: true } as any);
    });
  });

  describe('5. 이벤트 리스너 옵션', () => {
    it('should use capture:true for priority event handling', () => {
      // RED: 캡처 단계에서 이벤트를 먼저 처리하여 우선순위 확보
      const callOrder: string[] = [];

      const bubbleHandler = () => {
        callOrder.push('bubble');
      };

      const captureHandler = () => {
        callOrder.push('capture');
      };

      container.addEventListener('wheel', bubbleHandler, { capture: false });
      container.addEventListener('wheel', captureHandler, { capture: true });

      const wheelEvent = createWheelEvent(100);
      container.dispatchEvent(wheelEvent);

      // 캡처 단계가 먼저 실행되어야 함
      expect(callOrder).toEqual(['capture', 'bubble']);

      container.removeEventListener('wheel', bubbleHandler);
      container.removeEventListener('wheel', captureHandler, { capture: true } as any);
    });

    it('should register passive:false only when preventDefault is needed', () => {
      // GREEN: preventDefault가 필요한 경우에만 passive:false 사용
      const passiveHandler = vi.fn((event: Event) => {
        // passive:true인 경우 preventDefault 호출 불가
        try {
          event.preventDefault();
        } catch (err) {
          // passive:true에서는 에러 발생
        }
      });

      const activeHandler = vi.fn((event: Event) => {
        // passive:false인 경우 preventDefault 가능
        event.preventDefault();
      });

      // Passive listener (read-only)
      container.addEventListener('wheel', passiveHandler, { passive: true });

      // Active listener (can prevent default)
      container.addEventListener('wheel', activeHandler, { passive: false });

      const wheelEvent = createWheelEvent(100);
      container.dispatchEvent(wheelEvent);

      expect(passiveHandler).toHaveBeenCalled();
      expect(activeHandler).toHaveBeenCalled();
      expect(wheelEvent.defaultPrevented).toBe(true);

      container.removeEventListener('wheel', passiveHandler);
      container.removeEventListener('wheel', activeHandler);
    });
  });
});
