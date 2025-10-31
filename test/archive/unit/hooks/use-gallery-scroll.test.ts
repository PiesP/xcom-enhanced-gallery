/**
 * @fileoverview Phase 61: 갤러리 스크롤 동작 정리 테스트 (TDD RED)
 * @description useGalleryScroll이 scrollBy를 호출하지 않고, 방향 감지와 트위터 스크롤 차단만 수행하는지 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'solid-js';
import { getSolid } from '@/shared/external/vendors';

const { createSignal } = getSolid();

// Mock 설정
vi.mock('@/shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/shared/state/signals/gallery.signals', () => {
  const { createSignal } = getSolid();
  const [isOpen, setIsOpen] = createSignal(true);

  return {
    galleryState: {
      subscribe: vi.fn(),
      value: { isOpen: true },
    },
    gallerySignals: {
      isOpen: { value: true },
    },
  };
});

vi.mock('@/shared/utils/core-utils', () => ({
  findTwitterScrollContainer: vi.fn(() => null),
}));

describe('Phase 61: useGalleryScroll - 스크롤 동작 정리', () => {
  let dispose: (() => void) | undefined;
  let mockContainer: globalThis.HTMLDivElement;
  let mockScrollTarget: globalThis.HTMLDivElement;

  beforeEach(() => {
    // DOM 환경 설정
    mockContainer = document.createElement('div');
    mockContainer.className = 'xeg-gallery-container';
    mockScrollTarget = document.createElement('div');
    mockScrollTarget.className = 'items-container';
    mockContainer.appendChild(mockScrollTarget);
    document.body.appendChild(mockContainer);

    // JSDOM에 scrollBy 메서드 추가 (없을 경우 mock으로 설정)
    if (!mockScrollTarget.scrollBy) {
      mockScrollTarget.scrollBy = vi.fn();
    }
    if (!mockContainer.scrollBy) {
      mockContainer.scrollBy = vi.fn();
    }

    // scrollBy spy 설정
    vi.spyOn(mockScrollTarget, 'scrollBy');
    vi.spyOn(mockContainer, 'scrollBy');
  });

  afterEach(() => {
    // Cleanup
    dispose?.();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('RED: scrollBy 호출 방지', () => {
    it('휠 이벤트 발생 시 onScroll 콜백이 scrollBy를 호출하지 않아야 함', async () => {
      // Given: useGalleryScroll 훅이 활성화된 상태
      const { useGalleryScroll } = await import('@/features/gallery/hooks/useGalleryScroll');
      const onScrollSpy = vi.fn();

      await new Promise<void>(resolve => {
        dispose = createRoot(innerDispose => {
          useGalleryScroll({
            container: mockContainer,
            scrollTarget: mockScrollTarget,
            onScroll: onScrollSpy,
            enabled: true,
          });

          resolve();
          return innerDispose;
        });
      });

      // When: 휠 이벤트 발생
      const wheelEvent = new globalThis.WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(wheelEvent);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Then: onScroll 콜백이 호출되었지만
      expect(onScrollSpy).toHaveBeenCalled();

      // scrollBy는 호출되지 않아야 함
      expect(mockScrollTarget.scrollBy).not.toHaveBeenCalled();
      expect(mockContainer.scrollBy).not.toHaveBeenCalled();
    });

    it('onScroll 콜백에서 scrollBy 대신 브라우저 네이티브 스크롤을 사용해야 함', async () => {
      // Given: useGalleryScroll 훅이 활성화된 상태
      const { useGalleryScroll } = await import('@/features/gallery/hooks/useGalleryScroll');
      let capturedCallback: ((delta: number, target: HTMLElement | null) => void) | undefined;

      await new Promise<void>(resolve => {
        dispose = createRoot(innerDispose => {
          useGalleryScroll({
            container: mockContainer,
            scrollTarget: mockScrollTarget,
            onScroll: (delta, target) => {
              capturedCallback = (d, t) => {
                // 이 콜백 내부에서 scrollBy를 호출하지 않아야 함
                // 브라우저 네이티브 스크롤만 허용
              };
              capturedCallback(delta, target);
            },
            enabled: true,
          });

          resolve();
          return innerDispose;
        });
      });

      // When: 휠 이벤트 발생
      const wheelEvent = new globalThis.WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(wheelEvent);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Then: scrollBy가 호출되지 않음
      expect(mockScrollTarget.scrollBy).not.toHaveBeenCalled();
      expect(mockContainer.scrollBy).not.toHaveBeenCalled();
    });
  });

  describe('GREEN: 방향 감지 기능 유지', () => {
    it('휠 이벤트 발생 시 스크롤 방향을 감지해야 함', async () => {
      // Given: 방향 감지가 활성화된 useGalleryScroll
      const { useGalleryScroll } = await import('@/features/gallery/hooks/useGalleryScroll');
      const onDirectionChangeSpy = vi.fn();

      await new Promise<void>(resolve => {
        dispose = createRoot(innerDispose => {
          const { scrollDirection } = useGalleryScroll({
            container: mockContainer,
            scrollTarget: mockScrollTarget,
            enabled: true,
            enableScrollDirection: true,
            onScrollDirectionChange: onDirectionChangeSpy,
          });

          resolve();
          return innerDispose;
        });
      });

      // When: 아래로 스크롤하는 휠 이벤트 발생
      const wheelEvent = new globalThis.WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(wheelEvent);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Then: 방향 감지 콜백이 호출되어야 함
      expect(onDirectionChangeSpy).toHaveBeenCalledWith('down');
    });

    it('음수 deltaY는 "up" 방향으로 감지해야 함', async () => {
      // Given: 방향 감지가 활성화된 useGalleryScroll
      const { useGalleryScroll } = await import('@/features/gallery/hooks/useGalleryScroll');
      const onDirectionChangeSpy = vi.fn();

      await new Promise<void>(resolve => {
        dispose = createRoot(innerDispose => {
          useGalleryScroll({
            container: mockContainer,
            scrollTarget: mockScrollTarget,
            enabled: true,
            enableScrollDirection: true,
            onScrollDirectionChange: onDirectionChangeSpy,
          });

          resolve();
          return innerDispose;
        });
      });

      // When: 위로 스크롤하는 휠 이벤트 발생
      const wheelEvent = new globalThis.WheelEvent('wheel', {
        deltaY: -100,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(wheelEvent);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Then: "up" 방향으로 감지되어야 함
      expect(onDirectionChangeSpy).toHaveBeenCalledWith('up');
    });
  });

  describe('GREEN: 트위터 스크롤 차단 기능 유지', () => {
    it('blockTwitterScroll이 true일 때 트위터 스크롤을 차단해야 함', async () => {
      // Given: 트위터 컨테이너가 존재하는 환경
      const { findTwitterScrollContainer } = await import('@/shared/utils/core-utils');
      const mockTwitterContainer = document.createElement('div');
      mockTwitterContainer.className = 'twitter-container';
      document.body.appendChild(mockTwitterContainer);
      vi.mocked(findTwitterScrollContainer).mockReturnValue(mockTwitterContainer);

      const { useGalleryScroll } = await import('@/features/gallery/hooks/useGalleryScroll');

      await new Promise<void>(resolve => {
        dispose = createRoot(innerDispose => {
          const { isScrolling } = useGalleryScroll({
            container: mockContainer,
            scrollTarget: mockScrollTarget,
            enabled: true,
            blockTwitterScroll: true,
          });

          resolve();
          return innerDispose;
        });
      });

      // When: 휠 이벤트 발생하여 isScrolling이 true가 됨
      const wheelEvent = new globalThis.WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(wheelEvent);

      await new Promise(resolve => setTimeout(resolve, 50));

      // Then: 트위터 컨테이너에 이벤트 리스너가 등록되어야 함
      // (실제 구현에서는 preventTwitterScroll 함수가 호출됨)
      expect(findTwitterScrollContainer).toHaveBeenCalled();

      // Cleanup
      mockTwitterContainer.remove();
    });
  });

  describe('REFACTOR: 코드 단순화', () => {
    it('useGalleryScroll은 오직 감지(detect)만 수행하고, 실행(execute)은 하지 않아야 함', async () => {
      // Given: useGalleryScroll의 책임 범위
      const { useGalleryScroll } = await import('@/features/gallery/hooks/useGalleryScroll');

      await new Promise<void>(resolve => {
        dispose = createRoot(innerDispose => {
          const result = useGalleryScroll({
            container: mockContainer,
            scrollTarget: mockScrollTarget,
            enabled: true,
          });

          // Then: 반환값은 상태(state)만 포함해야 함
          expect(result).toHaveProperty('lastScrollTime');
          expect(result).toHaveProperty('isScrolling');
          expect(result).toHaveProperty('scrollDirection');

          // scrollBy 같은 실행 함수를 포함하지 않아야 함
          expect(result).not.toHaveProperty('scrollBy');
          expect(result).not.toHaveProperty('scrollTo');

          resolve();
          return innerDispose;
        });
      });
    });
  });
});
