/**
 * @fileoverview Phase 140.5: 스크롤 체이닝 경계 조건 검증
 * @description 갤러리 스크롤 경계에서의 페이지 스크롤 방지 검증
 *
 * **테스트 목적**:
 * 스크롤 경계 감지 로직 및 경계에서의 스크롤 체이닝 방지 패턴 검증
 *
 * **실제 구현 방식**:
 * - CSS `overscroll-behavior: none`이 자동으로 경계 처리
 * - 브라우저가 네이티브로 "더 이상 스크롤할 수 없음"을 인식하고 전파 차단
 * - 명시적인 경계 감지 코드 불필요 (브라우저가 처리)
 *
 * **테스트-구현 관계**:
 * - 이 테스트는 "수동으로 경계를 감지해야 한다면" 어떻게 구현할지 보여줌
 * - 실제로는 CSS가 브라우저 레벨에서 자동 처리
 * - 경계 감지 알고리즘의 정확성 검증 (향후 필요시 참조)
 *
 * @see src/features/gallery/hooks/useGalleryScroll.ts - 실제 구현
 * @see test/unit/features/scroll-chaining-css.test.ts - CSS 기반 테스트
 * @see test/browser/scroll-chaining-propagation.test.ts - 브라우저 실제 동작 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Phase 140.5: Scroll Chaining Boundary Conditions', () => {
  let galleryContainer: HTMLElement;
  let scrollableContent: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';

    // 갤러리 컨테이너 (스크롤 가능)
    galleryContainer = document.createElement('div');
    galleryContainer.className = 'gallery-container';
    galleryContainer.style.height = '500px';
    galleryContainer.style.overflowY = 'auto';
    galleryContainer.style.overscrollBehavior = 'none';

    // 스크롤 가능한 콘텐츠 (갤러리보다 큼)
    scrollableContent = document.createElement('div');
    scrollableContent.style.height = '2000px';
    scrollableContent.textContent = 'Scrollable gallery content';

    galleryContainer.appendChild(scrollableContent);
    document.body.appendChild(galleryContainer);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('1. 상단 경계 (Top Boundary)', () => {
    it('should detect when scroll reaches top', () => {
      // RED: 스크롤이 맨 위에 도달했는지 감지
      galleryContainer.scrollTop = 0;

      const isAtTop = galleryContainer.scrollTop === 0;

      expect(isAtTop).toBe(true);
    });

    it('should prevent further upward scroll at top boundary', () => {
      // RED: 맨 위에서 추가 위쪽 스크롤 방지
      galleryContainer.scrollTop = 0;

      let preventDefaultCalled = false;

      const wheelHandler = (event: WheelEvent) => {
        const isAtTop = galleryContainer.scrollTop === 0;
        const isScrollingUp = event.deltaY < 0;

        if (isAtTop && isScrollingUp) {
          event.preventDefault();
          preventDefaultCalled = event.defaultPrevented;
        }
      };

      galleryContainer.addEventListener('wheel', wheelHandler, { passive: false });

      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: -100, // 위쪽 스크롤
      });
      galleryContainer.dispatchEvent(wheelEvent);

      // 기본 동작이 차단되어야 함
      expect(preventDefaultCalled).toBe(true);

      galleryContainer.removeEventListener('wheel', wheelHandler);
    });

    it('should allow downward scroll from top', () => {
      // GREEN: 맨 위에서 아래쪽 스크롤은 허용
      galleryContainer.scrollTop = 0;

      let preventDefaultCalled = false;

      const wheelHandler = (event: WheelEvent) => {
        const isAtTop = galleryContainer.scrollTop === 0;
        const isScrollingUp = event.deltaY < 0;

        if (isAtTop && isScrollingUp) {
          event.preventDefault();
        }
        preventDefaultCalled = event.defaultPrevented;
      };

      galleryContainer.addEventListener('wheel', wheelHandler, { passive: false });

      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: 100, // 아래쪽 스크롤
      });
      galleryContainer.dispatchEvent(wheelEvent);

      // 기본 동작이 차단되지 않아야 함
      expect(preventDefaultCalled).toBe(false);

      galleryContainer.removeEventListener('wheel', wheelHandler);
    });
  });

  describe('2. 하단 경계 (Bottom Boundary)', () => {
    it('should detect when scroll reaches bottom', () => {
      // RED: 스크롤이 맨 아래에 도달했는지 감지
      const maxScrollTop = scrollableContent.offsetHeight - galleryContainer.offsetHeight;
      galleryContainer.scrollTop = maxScrollTop;

      const isAtBottom =
        galleryContainer.scrollTop + galleryContainer.offsetHeight >=
        scrollableContent.offsetHeight - 1;

      expect(isAtBottom).toBe(true);
    });

    it('should prevent further downward scroll at bottom boundary', () => {
      // RED: 맨 아래에서 추가 아래쪽 스크롤 방지
      const maxScrollTop = scrollableContent.offsetHeight - galleryContainer.offsetHeight;
      galleryContainer.scrollTop = maxScrollTop;

      let preventDefaultCalled = false;

      const wheelHandler = (event: WheelEvent) => {
        const isAtBottom =
          galleryContainer.scrollTop + galleryContainer.offsetHeight >=
          scrollableContent.offsetHeight - 1;
        const isScrollingDown = event.deltaY > 0;

        if (isAtBottom && isScrollingDown) {
          event.preventDefault();
          preventDefaultCalled = event.defaultPrevented;
        }
      };

      galleryContainer.addEventListener('wheel', wheelHandler, { passive: false });

      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: 100, // 아래쪽 스크롤
      });
      galleryContainer.dispatchEvent(wheelEvent);

      // 기본 동작이 차단되어야 함
      expect(preventDefaultCalled).toBe(true);

      galleryContainer.removeEventListener('wheel', wheelHandler);
    });

    it('should allow upward scroll from bottom', () => {
      // GREEN: 맨 아래에서 위쪽 스크롤은 허용
      const maxScrollTop = scrollableContent.offsetHeight - galleryContainer.offsetHeight;
      galleryContainer.scrollTop = maxScrollTop;

      let preventDefaultCalled = false;

      const wheelHandler = (event: WheelEvent) => {
        const isAtBottom =
          galleryContainer.scrollTop + galleryContainer.offsetHeight >=
          scrollableContent.offsetHeight - 1;
        const isScrollingDown = event.deltaY > 0;

        if (isAtBottom && isScrollingDown) {
          event.preventDefault();
        }
        preventDefaultCalled = event.defaultPrevented;
      };

      galleryContainer.addEventListener('wheel', wheelHandler, { passive: false });

      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: -100, // 위쪽 스크롤
      });
      galleryContainer.dispatchEvent(wheelEvent);

      // 기본 동작이 차단되지 않아야 함
      expect(preventDefaultCalled).toBe(false);

      galleryContainer.removeEventListener('wheel', wheelHandler);
    });
  });

  describe('3. 중간 위치 (Middle Position)', () => {
    it('should allow scrolling in both directions when in middle', () => {
      // GREEN: 중간 위치에서는 양방향 스크롤 허용
      // JSDOM limitation: offsetHeight가 0이므로 모킹 필요
      Object.defineProperty(scrollableContent, 'offsetHeight', {
        configurable: true,
        get: () => 2000,
      });
      Object.defineProperty(galleryContainer, 'offsetHeight', {
        configurable: true,
        get: () => 500,
      });

      const middlePosition = (2000 - 500) / 2;
      galleryContainer.scrollTop = middlePosition;

      let upwardPrevented = false;
      let downwardPrevented = false;

      const wheelHandler = (event: WheelEvent) => {
        const isAtTop = galleryContainer.scrollTop === 0;
        const isAtBottom =
          galleryContainer.scrollTop + galleryContainer.offsetHeight >=
          scrollableContent.offsetHeight - 1;
        const isScrollingUp = event.deltaY < 0;
        const isScrollingDown = event.deltaY > 0;

        if ((isAtTop && isScrollingUp) || (isAtBottom && isScrollingDown)) {
          event.preventDefault();
        }

        if (isScrollingUp) {
          upwardPrevented = event.defaultPrevented;
        } else if (isScrollingDown) {
          downwardPrevented = event.defaultPrevented;
        }
      };

      galleryContainer.addEventListener('wheel', wheelHandler, { passive: false });

      // 위쪽 스크롤
      const upEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100 });
      galleryContainer.dispatchEvent(upEvent);

      // 아래쪽 스크롤
      const downEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 });
      galleryContainer.dispatchEvent(downEvent);

      // 둘 다 차단되지 않아야 함
      expect(upwardPrevented).toBe(false);
      expect(downwardPrevented).toBe(false);

      galleryContainer.removeEventListener('wheel', wheelHandler);
    });
  });

  describe('4. 경계 오차 범위 (Boundary Tolerance)', () => {
    it('should account for rounding errors at boundaries', () => {
      // RED: 부동소수점 오차를 고려한 경계 판정
      const maxScrollTop = scrollableContent.offsetHeight - galleryContainer.offsetHeight;
      galleryContainer.scrollTop = maxScrollTop - 0.5; // 0.5px 오차

      const tolerance = 1; // 1px 허용 오차
      const isNearBottom =
        galleryContainer.scrollTop + galleryContainer.offsetHeight >=
        scrollableContent.offsetHeight - tolerance;

      expect(isNearBottom).toBe(true);
    });

    it('should use tolerance for top boundary detection', () => {
      // RED: 상단 경계에서도 허용 오차 적용
      galleryContainer.scrollTop = 0.5; // 0.5px 오차

      const tolerance = 1;
      const isNearTop = galleryContainer.scrollTop <= tolerance;

      expect(isNearTop).toBe(true);
    });
  });

  describe('5. 동적 콘텐츠 크기 변경', () => {
    it('should recalculate boundaries when content size changes', () => {
      // RED: 콘텐츠 크기 변경 시 경계 재계산
      // JSDOM limitation: offsetHeight 모킹
      Object.defineProperty(scrollableContent, 'offsetHeight', {
        configurable: true,
        writable: true,
        value: 2000,
      });
      Object.defineProperty(galleryContainer, 'offsetHeight', {
        configurable: true,
        value: 500,
      });

      const initialMaxScroll = scrollableContent.offsetHeight - galleryContainer.offsetHeight;

      // 콘텐츠 크기 변경
      scrollableContent.style.height = '3000px';
      Object.defineProperty(scrollableContent, 'offsetHeight', {
        configurable: true,
        writable: true,
        value: 3000,
      });

      const newMaxScroll = scrollableContent.offsetHeight - galleryContainer.offsetHeight;

      // 최대 스크롤 위치가 달라져야 함
      expect(newMaxScroll).toBeGreaterThan(initialMaxScroll);
    });

    it('should adjust scroll position if content shrinks', () => {
      // GREEN: 콘텐츠가 줄어들 때 스크롤 위치 조정
      // JSDOM limitation: offsetHeight 모킹
      Object.defineProperty(scrollableContent, 'offsetHeight', {
        configurable: true,
        writable: true,
        value: 2000,
      });
      Object.defineProperty(galleryContainer, 'offsetHeight', {
        configurable: true,
        value: 500,
      });

      // 맨 아래로 스크롤
      const maxScrollTop = scrollableContent.offsetHeight - galleryContainer.offsetHeight;
      galleryContainer.scrollTop = maxScrollTop;

      // 콘텐츠 크기 줄임
      scrollableContent.style.height = '600px';
      Object.defineProperty(scrollableContent, 'offsetHeight', {
        configurable: true,
        writable: true,
        value: 600,
      });

      const newMaxScroll = Math.max(
        0,
        scrollableContent.offsetHeight - galleryContainer.offsetHeight
      );

      // 새로운 최대 스크롤 위치가 이전보다 작아야 함
      expect(newMaxScroll).toBeLessThan(maxScrollTop);
    });
  });

  describe('6. 중첩된 스크롤 컨테이너', () => {
    it('should prevent parent scroll when child reaches boundary', () => {
      // RED: 자식이 경계에 도달해도 부모 스크롤 방지
      const parent = document.createElement('div');
      parent.style.height = '800px';
      parent.style.overflowY = 'auto';

      const parentContent = document.createElement('div');
      parentContent.style.height = '1500px';

      parent.appendChild(galleryContainer);
      parent.appendChild(parentContent);
      document.body.appendChild(parent);

      // 자식 갤러리를 맨 위로
      galleryContainer.scrollTop = 0;

      let parentScrolled = false;
      parent.addEventListener('scroll', () => {
        parentScrolled = true;
      });

      let childWheelPrevented = false;
      const wheelHandler = (event: WheelEvent) => {
        const isAtTop = galleryContainer.scrollTop === 0;
        const isScrollingUp = event.deltaY < 0;

        if (isAtTop && isScrollingUp) {
          event.preventDefault();
          event.stopPropagation();
          childWheelPrevented = event.defaultPrevented;
        }
      };

      galleryContainer.addEventListener('wheel', wheelHandler, { passive: false });

      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: -100,
      });
      galleryContainer.dispatchEvent(wheelEvent);

      // 자식 이벤트가 차단되고 부모는 스크롤되지 않아야 함
      expect(childWheelPrevented).toBe(true);
      expect(parentScrolled).toBe(false);

      galleryContainer.removeEventListener('wheel', wheelHandler);
      document.body.removeChild(parent);
    });
  });
});
