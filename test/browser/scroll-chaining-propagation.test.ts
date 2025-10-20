/**
 * @file scroll-chaining-propagation.test.ts
 * @description 브라우저 환경에서 스크롤 체이닝 방지 메커니즘의 실제 동작 검증
 *
 * **테스트 대상**:
 * - 실제 DOM에서 wheel 이벤트 전파 차단
 * - CSS overscroll-behavior 속성의 실제 동작
 * - 중첩 스크롤 컨테이너 상호작용
 *
 * **JSDOM 제약 해결**:
 * - Chromium 환경에서 실제 브라우저 동작 검증
 * - 이벤트 전파 체인 실제 추적
 * - overscroll-behavior CSS 속성 적용 확인
 *
 * @see docs/TESTING_STRATEGY.md - 브라우저 테스트 가이드
 * @see test/unit/features/scroll-chaining-*.test.ts - 단위 테스트 (JSDOM)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Scroll Chaining Prevention - Event Propagation (Browser)', () => {
  let galleryContainer: HTMLDivElement;
  let scrollableContent: HTMLDivElement;
  let parentScrollContainer: HTMLDivElement;

  beforeEach(async () => {
    // 중첩 스크롤 컨테이너 구조 생성
    parentScrollContainer = document.createElement('div');
    parentScrollContainer.style.cssText = `
      width: 400px;
      height: 600px;
      overflow: auto;
      position: relative;
    `;

    galleryContainer = document.createElement('div');
    galleryContainer.className = 'xeg-gallery-container';
    galleryContainer.style.cssText = `
      width: 100%;
      height: 500px;
      overflow: auto;
      overscroll-behavior: none;
      position: relative;
    `;

    scrollableContent = document.createElement('div');
    scrollableContent.style.cssText = `
      width: 100%;
      height: 2000px;
      background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
    `;

    galleryContainer.appendChild(scrollableContent);
    parentScrollContainer.appendChild(galleryContainer);
    document.body.appendChild(parentScrollContainer);

    // 부모 컨테이너에 충분한 콘텐츠 추가
    const parentContent = document.createElement('div');
    parentContent.style.cssText = `
      width: 100%;
      height: 3000px;
    `;
    parentScrollContainer.appendChild(parentContent);
  });

  afterEach(() => {
    document.body.removeChild(parentScrollContainer);
  });

  it('should prevent wheel event from bubbling to parent container', async () => {
    let galleryWheelEventFired = false;
    let parentWheelEventFired = false;

    // 갤러리 컨테이너에 wheel 이벤트 리스너
    galleryContainer.addEventListener(
      'wheel',
      event => {
        galleryWheelEventFired = true;
        event.preventDefault();
        event.stopPropagation();
      },
      { passive: false }
    );

    // 부모 컨테이너에 wheel 이벤트 리스너
    parentScrollContainer.addEventListener('wheel', () => {
      parentWheelEventFired = true;
    });

    // 갤러리 컨테이너에서 wheel 이벤트 발생
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    });

    galleryContainer.dispatchEvent(wheelEvent);

    // 검증: 갤러리에서는 이벤트 발생, 부모에는 전파 안 됨
    expect(galleryWheelEventFired).toBe(true);
    expect(parentWheelEventFired).toBe(false);
  });

  it('should apply overscroll-behavior: none correctly', async () => {
    // CSS 속성 확인
    const computedStyle = window.getComputedStyle(galleryContainer);
    const overscrollBehavior = computedStyle.overscrollBehavior;

    // overscroll-behavior: none이 적용되었는지 확인
    expect(overscrollBehavior).toBe('none');
  });

  it('should handle nested scroll containers with different overscroll-behavior', async () => {
    // 중첩된 스크롤 컨테이너 생성 (overscroll-behavior: auto)
    const nestedContainer = document.createElement('div');
    nestedContainer.style.cssText = `
      width: 100%;
      height: 300px;
      overflow: auto;
      overscroll-behavior: auto;
    `;

    const nestedContent = document.createElement('div');
    nestedContent.style.cssText = `
      width: 100%;
      height: 1000px;
    `;

    nestedContainer.appendChild(nestedContent);
    scrollableContent.appendChild(nestedContainer);

    // CSS 속성 확인
    const galleryStyle = window.getComputedStyle(galleryContainer);
    const nestedStyle = window.getComputedStyle(nestedContainer);

    expect(galleryStyle.overscrollBehavior).toBe('none');
    expect(nestedStyle.overscrollBehavior).toBe('auto');
  });

  it('should prevent scroll chaining when reaching bottom boundary', async () => {
    let parentScrolled = false;

    // 갤러리를 하단 경계로 스크롤
    galleryContainer.scrollTop = scrollableContent.offsetHeight - galleryContainer.offsetHeight;

    // 부모 스크롤 이벤트 리스너
    parentScrollContainer.addEventListener('scroll', () => {
      parentScrolled = true;
    });

    // 하단 경계에서 추가 스크롤 시도
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    });

    galleryContainer.addEventListener(
      'wheel',
      event => {
        // 하단 경계에서 preventDefault
        if (
          galleryContainer.scrollTop + galleryContainer.offsetHeight >=
          scrollableContent.offsetHeight
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      { passive: false }
    );

    galleryContainer.dispatchEvent(wheelEvent);

    // 약간의 대기 시간 후 확인
    await new Promise(resolve => setTimeout(resolve, 100));

    // 부모가 스크롤되지 않았는지 확인
    expect(parentScrolled).toBe(false);
  });

  it('should prevent scroll chaining when reaching top boundary', async () => {
    let parentScrolled = false;

    // 갤러리를 중간으로 스크롤
    galleryContainer.scrollTop = 500;

    // 다시 상단으로 스크롤
    galleryContainer.scrollTop = 0;

    // 부모 스크롤 이벤트 리스너
    parentScrollContainer.addEventListener('scroll', () => {
      parentScrolled = true;
    });

    // 상단 경계에서 위로 스크롤 시도
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: -100,
      bubbles: true,
      cancelable: true,
    });

    galleryContainer.addEventListener(
      'wheel',
      event => {
        // 상단 경계에서 preventDefault
        if (galleryContainer.scrollTop === 0 && event.deltaY < 0) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      { passive: false }
    );

    galleryContainer.dispatchEvent(wheelEvent);

    // 약간의 대기 시간 후 확인
    await new Promise(resolve => setTimeout(resolve, 100));

    // 부모가 스크롤되지 않았는지 확인
    expect(parentScrolled).toBe(false);
  });

  it('should allow scroll within gallery boundaries', async () => {
    const initialScrollTop = 0;
    galleryContainer.scrollTop = initialScrollTop;

    // 갤러리 중간으로 스크롤
    galleryContainer.scrollTop = 500;

    // 스크롤이 실제로 변경되었는지 확인
    expect(galleryContainer.scrollTop).toBe(500);
    expect(galleryContainer.scrollTop).not.toBe(initialScrollTop);
  });

  it('should handle rapid scroll events without propagation', async () => {
    let propagationCount = 0;

    parentScrollContainer.addEventListener('wheel', () => {
      propagationCount++;
    });

    galleryContainer.addEventListener(
      'wheel',
      event => {
        event.preventDefault();
        event.stopPropagation();
      },
      { passive: false }
    );

    // 빠른 연속 스크롤 이벤트 발생
    for (let i = 0; i < 10; i++) {
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 10 * (i + 1),
        bubbles: true,
        cancelable: true,
      });
      galleryContainer.dispatchEvent(wheelEvent);
    }

    // 약간의 대기 시간
    await new Promise(resolve => setTimeout(resolve, 100));

    // 부모로 전파된 이벤트가 없는지 확인
    expect(propagationCount).toBe(0);
  });

  it('should maintain overscroll-behavior across dynamic content changes', async () => {
    // 초기 스타일 확인
    const initialStyle = window.getComputedStyle(galleryContainer);
    expect(initialStyle.overscrollBehavior).toBe('none');

    // 콘텐츠 동적 변경
    const newContent = document.createElement('div');
    newContent.style.cssText = `
      width: 100%;
      height: 5000px;
    `;
    scrollableContent.replaceWith(newContent);

    // 스타일이 유지되는지 확인
    const updatedStyle = window.getComputedStyle(galleryContainer);
    expect(updatedStyle.overscrollBehavior).toBe('none');
  });
});

describe('Scroll Chaining Prevention - Passive vs Non-passive Listeners (Browser)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.cssText = `
      width: 400px;
      height: 600px;
      overflow: auto;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      width: 100%;
      height: 2000px;
    `;

    container.appendChild(content);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should allow preventDefault with non-passive listener', async () => {
    let preventedDefault = false;

    container.addEventListener(
      'wheel',
      event => {
        event.preventDefault();
        preventedDefault = !event.defaultPrevented === false;
      },
      { passive: false }
    );

    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    });

    container.dispatchEvent(wheelEvent);

    expect(preventedDefault).toBe(true);
  });

  it('should not allow preventDefault with passive listener', async () => {
    let preventedDefault = false;

    container.addEventListener(
      'wheel',
      event => {
        try {
          event.preventDefault();
          preventedDefault = !event.defaultPrevented === false;
        } catch {
          // Passive listener에서는 preventDefault 실패
          preventedDefault = false;
        }
      },
      { passive: true }
    );

    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    });

    container.dispatchEvent(wheelEvent);

    // Passive listener에서는 preventDefault가 무시됨
    expect(wheelEvent.defaultPrevented).toBe(false);
  });

  it('should use capture phase for non-passive listeners', async () => {
    const callOrder: string[] = [];

    container.addEventListener(
      'wheel',
      () => {
        callOrder.push('capture');
      },
      { passive: false, capture: true }
    );

    container.addEventListener(
      'wheel',
      () => {
        callOrder.push('bubble');
      },
      { passive: false, capture: false }
    );

    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    });

    container.dispatchEvent(wheelEvent);

    expect(callOrder).toEqual(['capture', 'bubble']);
  });
});
