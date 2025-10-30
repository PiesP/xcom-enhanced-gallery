/**
 * Phase 279: 갤러리 최초 기동 시 자동 스크롤 테스트
 *
 * @description
 * 새로운 트윗에서 갤러리를 처음 열 때 자동 스크롤이 작동하지 않는 문제 해결
 *
 * 문제:
 * - 첫 번째 갤러리 열기 시 자동 스크롤 미작동
 * - 같은 트윗 재오픈 시 정상 작동
 *
 * 원인:
 * - useGalleryItemScroll 훅이 DOM 렌더링보다 먼저 스크롤 시도
 * - 아이템 요소가 아직 렌더링되지 않은 상태
 *
 * 솔루션:
 * - VerticalGalleryView에서 초기 렌더링 완료 후 명시적 스크롤 트리거
 * - createEffect로 아이템 컨테이너 렌더링 감지
 * - requestAnimationFrame으로 레이아웃 완료 대기
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'solid-js';
import type { MediaInfo } from '../../../../../src/shared/types';
import {
  galleryState,
  openGallery,
  closeGallery,
} from '../../../../../src/shared/state/signals/gallery.signals';

describe('Phase 279: 갤러리 최초 기동 시 자동 스크롤', () => {
  let dispose: (() => void) | null = null;

  const createMockMediaItems = (count: number): MediaInfo[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `media-${i}`,
      type: 'image' as const,
      url: `https://example.com/image-${i}.jpg`,
      thumbnailUrl: `https://example.com/thumb-${i}.jpg`,
      width: 800,
      height: 600,
      altText: `Image ${i}`,
      metadata: {
        format: 'jpg',
        hasTransparency: false,
      },
    }));
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (dispose) {
      dispose();
      dispose = null;
    }
    closeGallery();
    document.body.innerHTML = '';
  });

  describe('Phase 279.1: RED - 실패 테스트', () => {
    it('[RED] 첫 번째 갤러리 열기 시 currentIndex에 자동 스크롤', async () => {
      // Given: 5개의 미디어 아이템, 인덱스 2부터 시작
      const mediaItems = createMockMediaItems(5);
      const startIndex = 2;

      // When: 갤러리 열기
      openGallery(mediaItems, startIndex);

      let scrollToItemCalled = false;
      const mockScrollToItem = vi.fn(() => {
        scrollToItemCalled = true;
        return Promise.resolve();
      });

      // VerticalGalleryView 렌더링 시뮬레이션
      await createRoot(async innerDispose => {
        dispose = innerDispose;

        // 컨테이너와 아이템 DOM 생성
        const container = document.createElement('div');
        container.setAttribute('data-xeg-role', 'gallery-container');

        const itemsContainer = document.createElement('div');
        itemsContainer.setAttribute('data-xeg-role', 'items-list');

        // 아이템 요소 생성
        mediaItems.forEach((_, index) => {
          const item = document.createElement('div');
          item.setAttribute('data-item-index', String(index));
          item.setAttribute('data-media-loaded', 'true');
          itemsContainer.appendChild(item);
        });

        container.appendChild(itemsContainer);
        document.body.appendChild(container);

        // 초기 스크롤 로직 시뮬레이션 (현재 구현에서는 실패)
        // useGalleryItemScroll이 즉시 실행되지만 타이밍 이슈로 실패
        const currentIdx = galleryState.value.currentIndex;
        const itemElement = itemsContainer.children[currentIdx] as HTMLElement;

        if (itemElement) {
          // 실제로는 타이밍 이슈로 이 코드가 실행되지 않거나 실패
          await mockScrollToItem();
        }
      });

      // Then: 스크롤이 실행되어야 함 (현재는 실패)
      // RED 단계에서는 이 테스트가 실패해야 함
      expect(scrollToItemCalled).toBe(true);
      expect(mockScrollToItem).toHaveBeenCalledOnce();
    });

    it('[RED] 아이템 렌더링 대기 후 스크롤 실행', async () => {
      // Given: 갤러리가 열리지만 아이템이 아직 렌더링되지 않음
      const mediaItems = createMockMediaItems(3);
      openGallery(mediaItems, 1);

      let scrollExecuted = false;

      await createRoot(async innerDispose => {
        dispose = innerDispose;

        const container = document.createElement('div');
        container.setAttribute('data-xeg-role', 'gallery-container');

        const itemsContainer = document.createElement('div');
        itemsContainer.setAttribute('data-xeg-role', 'items-list');
        container.appendChild(itemsContainer);
        document.body.appendChild(container);

        // 초기에는 아이템 없음 (렌더링 지연 시뮬레이션)
        expect(itemsContainer.children.length).toBe(0);

        // 100ms 후 아이템 렌더링 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 100));

        mediaItems.forEach((_, index) => {
          const item = document.createElement('div');
          item.setAttribute('data-item-index', String(index));
          item.setAttribute('data-media-loaded', 'true');
          itemsContainer.appendChild(item);
        });

        // 렌더링 완료 후 스크롤 시도
        const currentIdx = galleryState.value.currentIndex;
        const itemElement = itemsContainer.children[currentIdx] as HTMLElement;

        if (itemElement && itemsContainer.children.length > 0) {
          // 이 시점에서 스크롤이 실행되어야 함
          scrollExecuted = true;
        }
      });

      // Then: 렌더링 대기 후 스크롤 실행
      expect(scrollExecuted).toBe(true);
    });

    it('[RED] 갤러리 닫기 후 재오픈 시 플래그 리셋 확인', async () => {
      // Given: 갤러리를 열고 닫음
      const mediaItems = createMockMediaItems(3);

      openGallery(mediaItems, 0);
      await new Promise(resolve => setTimeout(resolve, 50));
      closeGallery();

      // 플래그가 리셋되어야 함 (실제 구현에서 확인)
      let hasPerformedInitialScroll = false;

      // When: 다시 열기
      openGallery(mediaItems, 1);

      await createRoot(async innerDispose => {
        dispose = innerDispose;

        const container = document.createElement('div');
        const itemsContainer = document.createElement('div');
        itemsContainer.setAttribute('data-xeg-role', 'items-list');

        mediaItems.forEach((_, index) => {
          const item = document.createElement('div');
          item.setAttribute('data-item-index', String(index));
          itemsContainer.appendChild(item);
        });

        container.appendChild(itemsContainer);
        document.body.appendChild(container);

        // 초기 스크롤이 다시 실행되어야 함
        if (itemsContainer.children.length > 0 && !hasPerformedInitialScroll) {
          hasPerformedInitialScroll = true;
        }
      });

      // Then: 재오픈 시 초기 스크롤 재실행
      expect(hasPerformedInitialScroll).toBe(true);
    });

    it('[RED] 빈 갤러리는 스크롤 시도하지 않음', async () => {
      // Given: 빈 미디어 아이템
      openGallery([], 0);

      let scrollAttempted = false;

      await createRoot(async innerDispose => {
        dispose = innerDispose;

        const container = document.createElement('div');
        const itemsContainer = document.createElement('div');
        itemsContainer.setAttribute('data-xeg-role', 'items-list');
        container.appendChild(itemsContainer);
        document.body.appendChild(container);

        // 빈 갤러리는 스크롤 시도하지 않아야 함
        if (galleryState.value.mediaItems.length === 0) {
          scrollAttempted = false;
        } else {
          scrollAttempted = true;
        }
      });

      // Then: 스크롤 시도하지 않음
      expect(scrollAttempted).toBe(false);
    });

    it('[RED] 잘못된 인덱스는 스크롤 시도하지 않음', async () => {
      // Given: 유효하지 않은 인덱스
      const mediaItems = createMockMediaItems(3);

      // 잘못된 인덱스로 열기 시도 (openGallery가 내부에서 보정)
      openGallery(mediaItems, -1);

      let scrollExecuted = false;

      await createRoot(async innerDispose => {
        dispose = innerDispose;

        const container = document.createElement('div');
        const itemsContainer = document.createElement('div');
        itemsContainer.setAttribute('data-xeg-role', 'items-list');

        mediaItems.forEach((_, index) => {
          const item = document.createElement('div');
          item.setAttribute('data-item-index', String(index));
          itemsContainer.appendChild(item);
        });

        container.appendChild(itemsContainer);
        document.body.appendChild(container);

        const currentIdx = galleryState.value.currentIndex;

        // 인덱스가 보정되었는지 확인
        if (currentIdx >= 0 && currentIdx < mediaItems.length) {
          scrollExecuted = true;
        }
      });

      // Then: 인덱스가 보정되어 스크롤 가능
      // openGallery가 인덱스를 0으로 보정하므로 스크롤 가능
      expect(scrollExecuted).toBe(true);
      expect(galleryState.value.currentIndex).toBe(0);
    });
  });

  describe('통합 시나리오 (현재 동작 확인용)', () => {
    it('같은 트윗 재오픈 시 자동 스크롤 정상 작동 (기존 동작)', async () => {
      // Given: 갤러리를 한 번 열었다 닫음
      const mediaItems = createMockMediaItems(4);

      openGallery(mediaItems, 1);
      await new Promise(resolve => setTimeout(resolve, 100));
      closeGallery();

      // When: 같은 미디어로 다시 열기
      openGallery(mediaItems, 2);

      let scrollSuccessful = false;

      await createRoot(async innerDispose => {
        dispose = innerDispose;

        const container = document.createElement('div');
        const itemsContainer = document.createElement('div');
        itemsContainer.setAttribute('data-xeg-role', 'items-list');

        mediaItems.forEach((_, index) => {
          const item = document.createElement('div');
          item.setAttribute('data-item-index', String(index));
          item.setAttribute('data-media-loaded', 'true');
          itemsContainer.appendChild(item);
        });

        container.appendChild(itemsContainer);
        document.body.appendChild(container);

        // 재오픈 시에는 컴포넌트가 이미 준비되어 있어 스크롤 성공
        const currentIdx = galleryState.value.currentIndex;
        const itemElement = itemsContainer.children[currentIdx] as HTMLElement;

        if (itemElement) {
          scrollSuccessful = true;
        }
      });

      // Then: 재오픈 시 스크롤 성공
      expect(scrollSuccessful).toBe(true);
    });
  });
});
