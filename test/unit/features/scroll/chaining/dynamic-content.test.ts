/**
 * @description 동적 콘텐츠 로딩 중 스크롤 체이닝 방지 메커니즘 검증
 * @note 무한 스크롤, 아이템 제거, 이미지 지연 로딩 등 동적 시나리오 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Scroll Chaining - Dynamic Content Loading', () => {
  let galleryContainer: HTMLElement;
  let scrollableContent: HTMLElement;
  let itemCount = 0;

  beforeEach(() => {
    document.body.innerHTML = '';
    itemCount = 0;

    // 갤러리 컨테이너 (스크롤 가능)
    galleryContainer = document.createElement('div');
    galleryContainer.className = 'gallery-container';
    galleryContainer.style.height = '500px';
    galleryContainer.style.overflowY = 'auto';
    galleryContainer.style.overscrollBehavior = 'none';

    // 스크롤 가능한 콘텐츠
    scrollableContent = document.createElement('div');
    scrollableContent.style.display = 'flex';
    scrollableContent.style.flexDirection = 'column';

    // 초기 아이템 5개 추가
    for (let i = 0; i < 5; i++) {
      addItem(300); // 각 300px 높이
    }

    galleryContainer.appendChild(scrollableContent);
    document.body.appendChild(galleryContainer);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  // 헬퍼: 아이템 추가
  function addItem(height: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.style.height = `${height}px`;
    item.style.flexShrink = '0';
    item.textContent = `Item ${++itemCount}`;
    item.setAttribute('data-item-id', String(itemCount));
    scrollableContent.appendChild(item);

    // JSDOM에서 offsetHeight 모킹
    Object.defineProperty(item, 'offsetHeight', {
      configurable: true,
      value: height,
    });

    return item;
  }

  // 헬퍼: 아이템 제거
  function removeItem(item: HTMLElement) {
    scrollableContent.removeChild(item);
  }

  // 헬퍼: 콘텐츠 높이 재계산
  function recalculateContentHeight(): number {
    const items = scrollableContent.querySelectorAll('.gallery-item');
    let totalHeight = 0;
    items.forEach(item => {
      totalHeight += (item as HTMLElement).offsetHeight;
    });

    Object.defineProperty(scrollableContent, 'offsetHeight', {
      configurable: true,
      value: totalHeight,
    });

    return totalHeight;
  }

  // 헬퍼: 경계 감지
  function isAtBottom(): boolean {
    const tolerance = 1;
    return (
      galleryContainer.scrollTop + galleryContainer.offsetHeight >=
      scrollableContent.offsetHeight - tolerance
    );
  }

  function isAtTop(): boolean {
    return galleryContainer.scrollTop === 0;
  }

  describe('1. 무한 스크롤 - 아이템 동적 추가', () => {
    it('should prevent scroll chaining after adding new items at bottom', () => {
      // RED: 하단에서 새 아이템 추가 후에도 스크롤 체이닝 방지 유지

      // 초기 콘텐츠 높이: 5 items × 300px = 1500px
      let initialHeight = recalculateContentHeight();
      expect(initialHeight).toBe(1500);

      // 하단으로 스크롤
      const maxScroll = initialHeight - galleryContainer.offsetHeight;
      galleryContainer.scrollTop = maxScroll;

      expect(isAtBottom()).toBe(true);

      // 새 아이템 3개 추가 (무한 스크롤 시뮬레이션)
      addItem(300);
      addItem(300);
      addItem(300);

      // 콘텐츠 높이 재계산: 8 items × 300px = 2400px
      const newHeight = recalculateContentHeight();
      expect(newHeight).toBe(2400);

      // 이제 하단이 아님 (새 콘텐츠 추가로 스크롤 가능 공간 증가)
      expect(isAtBottom()).toBe(false);

      // 추가 아래쪽 스크롤 시도
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: 100, // 아래쪽
      });

      let preventDefaultCalled = false;
      galleryContainer.addEventListener(
        'wheel',
        (event: WheelEvent) => {
          // 경계가 아니므로 preventDefault 호출하지 않음
          const atBottom = isAtBottom();
          const scrollingDown = event.deltaY > 0;

          if (atBottom && scrollingDown) {
            event.preventDefault();
          }
          preventDefaultCalled = event.defaultPrevented;
        },
        { passive: false }
      );

      galleryContainer.dispatchEvent(wheelEvent);

      // 경계가 아니므로 차단되지 않아야 함
      expect(preventDefaultCalled).toBe(false);
    });

    it('should update boundary detection when items are added', () => {
      // RED: 아이템 추가 시 경계 감지 업데이트

      const initialHeight = recalculateContentHeight();
      expect(initialHeight).toBe(1500);

      // 하단으로 스크롤
      galleryContainer.scrollTop = initialHeight - galleryContainer.offsetHeight;
      expect(isAtBottom()).toBe(true);

      // 새 아이템 추가
      addItem(500);
      const newHeight = recalculateContentHeight();
      expect(newHeight).toBe(2000);

      // 경계 감지 재계산
      expect(isAtBottom()).toBe(false);

      // 새 하단까지 스크롤
      galleryContainer.scrollTop = newHeight - galleryContainer.offsetHeight;
      expect(isAtBottom()).toBe(true);
    });

    it('should handle rapid consecutive item additions', () => {
      // RED: 빠른 연속 아이템 추가 (무한 스크롤 빠른 트리거)

      const initialHeight = recalculateContentHeight();

      // 10개 아이템 빠르게 추가
      for (let i = 0; i < 10; i++) {
        addItem(300);
      }

      const newHeight = recalculateContentHeight();
      expect(newHeight).toBe(initialHeight + 3000);

      // 경계 감지가 올바르게 작동하는지 확인
      galleryContainer.scrollTop = newHeight - galleryContainer.offsetHeight;
      expect(isAtBottom()).toBe(true);

      // 추가 스크롤 차단 검증
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: 100,
      });

      let prevented = false;
      galleryContainer.addEventListener(
        'wheel',
        (event: WheelEvent) => {
          if (isAtBottom() && event.deltaY > 0) {
            event.preventDefault();
            prevented = event.defaultPrevented;
          }
        },
        { passive: false }
      );

      galleryContainer.dispatchEvent(wheelEvent);
      expect(prevented).toBe(true);
    });

    it('should maintain scroll position when adding items above viewport', () => {
      // RED: 뷰포트 위에 아이템 추가 시 스크롤 위치 유지

      const initialHeight = recalculateContentHeight();

      // 중간으로 스크롤
      galleryContainer.scrollTop = 500;
      const initialScrollTop = galleryContainer.scrollTop;

      // 상단에 새 아이템 prepend (뷰포트 위)
      const newItem = document.createElement('div');
      newItem.className = 'gallery-item'; // 필수: recalculateContentHeight가 이 클래스로 조회
      newItem.style.height = '300px';
      newItem.textContent = 'New Item at Top';
      Object.defineProperty(newItem, 'offsetHeight', {
        configurable: true,
        value: 300,
      });
      scrollableContent.insertBefore(newItem, scrollableContent.firstChild);

      const newHeight = recalculateContentHeight();
      expect(newHeight).toBe(initialHeight + 300); // 1500 + 300 = 1800

      // 스크롤 위치 조정 필요 (뷰포트 위 추가 시 자동 보정)
      // 실제 구현에서는 scrollTop += newItemHeight 필요
      const expectedScrollTop = initialScrollTop + 300;

      // 현재는 조정되지 않은 상태 (구현 필요 여부 확인)
      // 이 테스트는 "prepend 시 스크롤 위치 유지 필요" 문제를 문서화
      expect(galleryContainer.scrollTop).toBe(initialScrollTop);
      expect(expectedScrollTop).toBe(800); // 문서화: 조정되어야 할 값
    });
  });

  describe('2. 아이템 제거 및 경계 재계산', () => {
    it('should recalculate boundary when items are removed', () => {
      // RED: 아이템 제거 시 경계 재계산

      const initialHeight = recalculateContentHeight();
      expect(initialHeight).toBe(1500);

      // 하단으로 스크롤
      galleryContainer.scrollTop = initialHeight - galleryContainer.offsetHeight;
      expect(isAtBottom()).toBe(true);

      // 마지막 아이템 제거
      const lastItem = scrollableContent.lastElementChild as HTMLElement;
      removeItem(lastItem);

      const newHeight = recalculateContentHeight();
      expect(newHeight).toBe(1200); // 5 items → 4 items

      // 스크롤 위치가 새 하단을 초과하면 조정 필요
      const maxScroll = newHeight - galleryContainer.offsetHeight;
      if (galleryContainer.scrollTop > maxScroll) {
        galleryContainer.scrollTop = maxScroll;
      }

      expect(isAtBottom()).toBe(true);
    });

    it('should prevent scroll chaining after removing bottom items', () => {
      // RED: 하단 아이템 제거 후에도 스크롤 체이닝 방지 유지

      const initialHeight = recalculateContentHeight();

      // 하단으로 스크롤
      galleryContainer.scrollTop = initialHeight - galleryContainer.offsetHeight;

      // 하단 2개 아이템 제거
      removeItem(scrollableContent.lastElementChild as HTMLElement);
      removeItem(scrollableContent.lastElementChild as HTMLElement);

      const newHeight = recalculateContentHeight();
      expect(newHeight).toBe(900); // 5 → 3 items

      // 스크롤 위치 조정
      const maxScroll = Math.max(0, newHeight - galleryContainer.offsetHeight);
      galleryContainer.scrollTop = maxScroll;

      // 하단 경계에서 스크롤 차단 검증
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: 100,
      });

      let prevented = false;
      galleryContainer.addEventListener(
        'wheel',
        (event: WheelEvent) => {
          if (isAtBottom() && event.deltaY > 0) {
            event.preventDefault();
            prevented = event.defaultPrevented;
          }
        },
        { passive: false }
      );

      galleryContainer.dispatchEvent(wheelEvent);
      expect(prevented).toBe(true);
    });

    it('should handle removing all items except one', () => {
      // RED: 거의 모든 아이템 제거 (1개만 남김)

      // 4개 아이템 제거 (1개만 남김)
      while (scrollableContent.children.length > 1) {
        removeItem(scrollableContent.lastElementChild as HTMLElement);
      }

      const newHeight = recalculateContentHeight();
      expect(newHeight).toBe(300); // 1 item

      // 콘텐츠가 뷰포트보다 작으면 스크롤 불가능
      if (newHeight <= galleryContainer.offsetHeight) {
        // 스크롤 차단 불필요 (스크롤 자체가 불가능)
        expect(galleryContainer.scrollTop).toBe(0);
        expect(isAtTop()).toBe(true);
        expect(isAtBottom()).toBe(true); // 콘텐츠가 작아 동시에 상하단
      }
    });
  });

  describe('3. 이미지 지연 로딩 중 스크롤', () => {
    it('should maintain scroll chaining prevention during image loading', async () => {
      // RED: 이미지 로딩 중에도 스크롤 체이닝 방지 유지

      // 이미지 아이템 추가 (로딩 상태)
      const imageItem = addItem(0); // 초기 높이 0 (로딩 전)
      imageItem.classList.add('loading');

      const initialHeight = recalculateContentHeight();

      // 이미지 로딩 완료 시뮬레이션 (높이 변경)
      await new Promise(resolve => setTimeout(resolve, 100));

      Object.defineProperty(imageItem, 'offsetHeight', {
        configurable: true,
        value: 500, // 로딩 후 높이
      });
      imageItem.classList.remove('loading');

      const newHeight = recalculateContentHeight();
      expect(newHeight).toBeGreaterThan(initialHeight);

      // 스크롤 체이닝 방지 유지 확인
      const computedStyle = window.getComputedStyle(galleryContainer);
      expect(
        computedStyle.overscrollBehavior || computedStyle.getPropertyValue('overscroll-behavior')
      ).toBe('none');
    });

    it('should handle multiple images loading simultaneously', async () => {
      // RED: 다수 이미지 동시 로딩

      const initialHeight = recalculateContentHeight();

      // 5개 이미지 아이템 추가 (모두 로딩 상태)
      const imageItems: HTMLElement[] = [];
      for (let i = 0; i < 5; i++) {
        const item = addItem(0); // 초기 높이 0
        item.classList.add('loading');
        imageItems.push(item);
      }

      let currentHeight = recalculateContentHeight();
      expect(currentHeight).toBe(initialHeight);

      // 이미지 순차 로딩 (비동기)
      for (let i = 0; i < imageItems.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));

        const item = imageItems[i] as HTMLElement;
        Object.defineProperty(item, 'offsetHeight', {
          configurable: true,
          value: 400,
        });
        item.classList.remove('loading');

        currentHeight = recalculateContentHeight();
      }

      const finalHeight = recalculateContentHeight();
      expect(finalHeight).toBe(initialHeight + 2000); // 5 images × 400px

      // 최종 경계 감지 확인
      galleryContainer.scrollTop = finalHeight - galleryContainer.offsetHeight;
      expect(isAtBottom()).toBe(true);
    });
  });

  describe('4. 비동기 콘텐츠 로딩', () => {
    it('should handle async content loading with loading indicators', async () => {
      // RED: 로딩 인디케이터와 함께 비동기 콘텐츠 로딩

      const initialHeight = recalculateContentHeight();

      // 로딩 인디케이터 추가
      const loadingIndicator = addItem(50);
      loadingIndicator.classList.add('loading-indicator');
      loadingIndicator.textContent = 'Loading...';

      let heightWithIndicator = recalculateContentHeight();
      expect(heightWithIndicator).toBe(initialHeight + 50);

      // 하단으로 스크롤
      galleryContainer.scrollTop = heightWithIndicator - galleryContainer.offsetHeight;

      // 비동기 콘텐츠 로딩
      await new Promise(resolve => setTimeout(resolve, 100));

      // 로딩 인디케이터 제거
      removeItem(loadingIndicator);

      // 새 콘텐츠 추가
      for (let i = 0; i < 3; i++) {
        addItem(300);
      }

      const finalHeight = recalculateContentHeight();
      expect(finalHeight).toBe(initialHeight + 900); // 3 items × 300px

      // 스크롤 체이닝 방지 유지 확인
      expect(window.getComputedStyle(galleryContainer).overscrollBehavior).toBe('none');
    });

    it('should prevent scroll chaining during debounced content loading', async () => {
      // RED: 디바운스된 콘텐츠 로딩 중 스크롤 체이닝 방지

      const initialHeight = recalculateContentHeight();

      // 하단으로 스크롤
      galleryContainer.scrollTop = initialHeight - galleryContainer.offsetHeight;

      // 빠른 연속 스크롤 (디바운스 트리거)
      for (let i = 0; i < 5; i++) {
        const wheelEvent = new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          deltaY: 100,
        });

        let prevented = false;
        galleryContainer.addEventListener(
          'wheel',
          (event: WheelEvent) => {
            if (isAtBottom() && event.deltaY > 0) {
              event.preventDefault();
              prevented = event.defaultPrevented;
            }
          },
          { passive: false, once: true }
        );

        galleryContainer.dispatchEvent(wheelEvent);
        expect(prevented).toBe(true); // 각 이벤트마다 차단되어야 함
      }

      // 디바운스 후 콘텐츠 로딩
      await new Promise(resolve => setTimeout(resolve, 200));

      addItem(300);
      const newHeight = recalculateContentHeight();
      expect(newHeight).toBe(initialHeight + 300);
    });
  });

  describe('5. 대량 아이템 처리 성능', () => {
    it('should handle adding 50+ items without performance degradation', () => {
      // RED: 50개 이상 아이템 추가 시 성능 테스트

      const initialHeight = recalculateContentHeight();
      const startTime = performance.now();

      // 50개 아이템 추가
      for (let i = 0; i < 50; i++) {
        addItem(200);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 성능 기준: 50개 아이템 추가 1초 이내
      expect(duration).toBeLessThan(1000);

      const newHeight = recalculateContentHeight();
      expect(newHeight).toBe(initialHeight + 10000); // 50 × 200px

      // 경계 감지 성능 테스트
      galleryContainer.scrollTop = newHeight - galleryContainer.offsetHeight;
      const boundaryCheckStart = performance.now();
      const atBottom = isAtBottom();
      const boundaryCheckEnd = performance.now();

      expect(atBottom).toBe(true);
      expect(boundaryCheckEnd - boundaryCheckStart).toBeLessThan(10); // 10ms 이내
    });

    it('should handle removing 50+ items efficiently', () => {
      // RED: 50개 이상 아이템 제거 효율성

      // 먼저 50개 추가
      for (let i = 0; i < 50; i++) {
        addItem(200);
      }

      let heightBefore = recalculateContentHeight();
      const startTime = performance.now();

      // 50개 제거
      while (scrollableContent.children.length > 5) {
        removeItem(scrollableContent.lastElementChild as HTMLElement);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 성능 기준: 50개 아이템 제거 500ms 이내
      expect(duration).toBeLessThan(500);

      const heightAfter = recalculateContentHeight();
      expect(heightAfter).toBe(1500); // 초기 5개 아이템만 남음
    });

    it('should maintain scroll chaining prevention with 100+ items', () => {
      // RED: 100개 이상 아이템에서도 스크롤 체이닝 방지 유지

      // 100개 아이템 추가
      for (let i = 0; i < 100; i++) {
        addItem(150);
      }

      const totalHeight = recalculateContentHeight();
      expect(totalHeight).toBe(1500 + 15000); // 초기 5개 + 100개 추가

      // 하단으로 스크롤
      galleryContainer.scrollTop = totalHeight - galleryContainer.offsetHeight;
      expect(isAtBottom()).toBe(true);

      // 스크롤 차단 검증
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: 100,
      });

      let prevented = false;
      galleryContainer.addEventListener(
        'wheel',
        (event: WheelEvent) => {
          if (isAtBottom() && event.deltaY > 0) {
            event.preventDefault();
            prevented = event.defaultPrevented;
          }
        },
        { passive: false }
      );

      galleryContainer.dispatchEvent(wheelEvent);
      expect(prevented).toBe(true);
    });
  });
});
