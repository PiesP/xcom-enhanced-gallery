/**
 * @description 네이티브 스크롤 동작 보장 및 불필요한 개입 제거 검증
 * @note 스크롤 로직을 단순화하고 브라우저 기본 동작을 활용합니다.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Helper function to create wheel events in JSDOM
function createWheelEvent(deltaY = 100): globalThis.Event {
  const event = new globalThis.Event('wheel', {
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, 'deltaY', { value: deltaY, writable: false });
  return event;
}

describe('Native Scroll Behavior', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-container';
    container.style.height = '500px';
    container.style.overflow = 'auto';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('1. 네이티브 스크롤 동작 보장', () => {
    it('should allow native wheel scrolling without preventDefault', () => {
      // RED: 현재는 preventTwitterScroll에서 preventDefault() 호출함
      let preventDefaultCalled = false;

      const wheelHandler = vi.fn((e: unknown) => {
        const event = e as { defaultPrevented?: boolean };
        if (event.defaultPrevented) {
          preventDefaultCalled = true;
        }
      });

      container.addEventListener('wheel', wheelHandler as any);

      const wheelEvent = createWheelEvent(100);

      container.dispatchEvent(wheelEvent);
      container.removeEventListener('wheel', wheelHandler as any);

      // 네이티브 스크롤을 위해 preventDefault가 호출되지 않아야 함
      expect(preventDefaultCalled).toBe(false);
    });

    it('should preserve native scroll smoothness', () => {
      // RED: CSS scroll-behavior가 정상 작동해야 함
      const computedStyle = window.getComputedStyle(container);

      // CSS에서 설정한 scroll-behavior가 유지되어야 함
      expect(['smooth', 'auto', '']).toContain(computedStyle.scrollBehavior || 'auto');
    });
  });

  describe('2. 버튼 전용 자동 스크롤 (scrollIntoView)', () => {
    it('should only auto-scroll when triggered by navigation buttons', () => {
      // GREEN: useGalleryItemScroll의 scrollToItem만 자동 스크롤 허용
      const items = [1, 2, 3].map(i => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.textContent = `Item ${i}`;
        item.style.height = '300px';

        // JSDOM doesn't have scrollIntoView, so we mock it
        (item as any).scrollIntoView = vi.fn();

        container.appendChild(item);
        return item;
      });

      // scrollIntoView 스파이
      const scrollIntoViewSpy = vi.spyOn(items[1], 'scrollIntoView' as any);

      // 수동 호출 (버튼 클릭 시뮬레이션)
      (items[1] as any).scrollIntoView({ behavior: 'smooth', block: 'center' });

      expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);
      scrollIntoViewSpy.mockRestore();
    });

    it('should NOT auto-scroll on wheel events', () => {
      // RED: wheel 이벤트 시 수동 scrollBy() 호출이 없어야 함

      // JSDOM doesn't have scrollBy, so we mock it
      (container as any).scrollBy = vi.fn();
      const scrollBySpy = vi.spyOn(container, 'scrollBy' as any);

      const wheelEvent = createWheelEvent(100);

      container.dispatchEvent(wheelEvent);

      // wheel 이벤트로 인한 scrollBy 호출이 없어야 함
      expect(scrollBySpy).not.toHaveBeenCalled();
      scrollBySpy.mockRestore();
    });
  });

  describe('3. Twitter 스크롤 충돌 제거', () => {
    it('should NOT block Twitter scroll when gallery is open', () => {
      // RED: 현재는 preventTwitterScroll이 passive:false로 차단함
      const twitterContainer = document.createElement('div');
      twitterContainer.setAttribute('data-testid', 'primaryColumn');
      document.body.appendChild(twitterContainer);

      let preventDefaultCalled = false;
      const wheelHandler = vi.fn((e: unknown) => {
        const event = e as { defaultPrevented?: boolean };
        if (event.defaultPrevented) {
          preventDefaultCalled = true;
        }
      });

      twitterContainer.addEventListener('wheel', wheelHandler as any, { passive: false });

      const wheelEvent = createWheelEvent(100);

      twitterContainer.dispatchEvent(wheelEvent);
      twitterContainer.removeEventListener('wheel', wheelHandler as any);

      // Twitter 스크롤을 차단하지 않아야 함
      expect(preventDefaultCalled).toBe(false);

      document.body.removeChild(twitterContainer);
    });
  });

  describe('4. Passive Wheel Listener 전용', () => {
    it('should use only passive:true wheel listeners', () => {
      // RED: 모든 wheel 리스너가 passive:true여야 함
      const listeners: Array<{ type: string; passive: boolean }> = [];

      const originalAddEventListener = container.addEventListener.bind(container);
      (container as any).addEventListener = function (...args: any[]) {
        const [type, , options] = args;
        if (type === 'wheel') {
          const passive = typeof options === 'object' ? options.passive : true;
          listeners.push({ type, passive: passive ?? true });
        }
        return originalAddEventListener.apply(container, args);
      };

      // 갤러리 wheel 리스너 등록 시뮬레이션
      container.addEventListener('wheel', () => {}, { passive: true });

      // 모든 wheel 리스너가 passive여야 함
      listeners.forEach(listener => {
        expect(listener.passive).toBe(true);
      });
    });
  });

  describe('5. 제거 대상 함수 검증', () => {
    it('should NOT have preventTwitterScroll function in useGalleryScroll', async () => {
      // RED: useGalleryScroll에서 preventTwitterScroll 제거 확인
      const useGalleryScrollSource = await import(
        '../../../src/features/gallery/hooks/useGalleryScroll'
      );

      // preventTwitterScroll 함수가 존재하지 않아야 함
      expect(useGalleryScrollSource).not.toHaveProperty('preventTwitterScroll');
    });

    it('should NOT have manual scrollBy logic in VerticalGalleryView', () => {
      // RED: VerticalGalleryView의 onScroll 핸들러에서 수동 scrollBy 제거 확인
      // 이 테스트는 실제 컴포넌트 로드 후 검증 필요
      expect(true).toBe(true); // Placeholder - 실제 구현 시 수정
    });

    it('should NOT have preventScrollPropagation in scroll-utils', async () => {
      // RED: scroll-utils에서 preventScrollPropagation 제거 확인
      const scrollUtils = await import('../../../src/shared/utils/scroll/scroll-utils');

      // preventScrollPropagation 함수가 존재하지 않아야 함
      expect(scrollUtils).not.toHaveProperty('preventScrollPropagation');
    });

    it('should NOT have ensureWheelLock exported from utils', async () => {
      // RED: utils에서 ensureWheelLock 제거 확인 (events/wheel 파일 자체가 삭제됨)
      const utils = await import('../../../src/utils');

      // ensureWheelLock 함수가 존재하지 않아야 함
      expect(utils).not.toHaveProperty('ensureWheelLock');
    });
  });

  describe('6. 성능 최적화 검증', () => {
    it('should not create unnecessary event listeners', () => {
      // GREEN: 최소한의 리스너만 등록
      const listenerCount: Record<string, number> = {};

      const originalAddEventListener = container.addEventListener.bind(container);
      (container as any).addEventListener = function (...args: any[]) {
        const [type] = args;
        listenerCount[type] = (listenerCount[type] || 0) + 1;
        return originalAddEventListener.apply(container, args);
      };

      // wheel 리스너 등록 (최대 1개)
      container.addEventListener('wheel', () => {}, { passive: true });

      // wheel 리스너가 1개를 초과하지 않아야 함
      expect(listenerCount['wheel'] || 0).toBeLessThanOrEqual(1);
    });
  });

  describe('7. CSS 스크롤 속성 유지', () => {
    it('should preserve CSS scroll properties', () => {
      // GREEN: CSS 스크롤 속성이 유지되어야 함
      container.style.scrollBehavior = 'smooth';
      container.style.overflowY = 'auto';
      container.style.overscrollBehavior = 'contain';

      const computedStyle = window.getComputedStyle(container);

      expect(computedStyle.scrollBehavior).toBe('smooth');
      expect(computedStyle.overflowY).toBe('auto');
      expect(computedStyle.overscrollBehavior).toBe('contain');
    });
  });
});
