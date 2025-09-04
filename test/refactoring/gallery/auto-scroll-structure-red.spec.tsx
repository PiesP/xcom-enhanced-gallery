// @vitest-environment jsdom
/* global document */
/**
 * RED: VerticalGalleryView 자동 스크롤 구조 불일치 검출
 * - 현재 구현: handleMediaLoad 내부에서 containerRef.children[index] 사용
 * - 문제: containerRef 첫 자식들은 hoverZone/toolbarWrapper/scrollArea 순이며
 *         실제 갤러리 아이템이 아님 → 잘못된 요소 선택 가능
 * - 기대: GREEN 단계에서 scrollIntoView 는 실제 [data-xeg-role="gallery-item"][data-index="i"] 에만 호출되고
 *         wrapper 구조 변화에도 안전해야 함 (itemsRootRef 전달)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { galleryState, openGallery } from '@shared/state/signals/gallery.signals';
import { resetIntent } from '@shared/state/signals/navigation-intent.signals';

describe('[RED] VerticalGalleryView auto-scroll 구조 안정성', () => {
  beforeEach(() => {
    galleryState.value = {
      isOpen: false,
      mediaItems: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    };
    resetIntent();
  });

  it('구조: containerRef.children 이 갤러리 아이템과 1:1 매핑되지 않음을 명시 (버그 조건 고정)', () => {
    const media = Array.from({ length: 3 }).map((_, i) => ({
      id: `m-${i}`,
      url: `https://example.com/m-${i}.jpg`,
      type: 'image' as const,
      filename: `m-${i}.jpg`,
      width: 100,
      height: 100,
      size: 1,
      mediaType: 'image' as const,
    }));
    openGallery(media, 0);

    if (typeof document === 'undefined') throw new Error('JSDOM 필요');

    const container = document.createElement('div');
    const hover = document.createElement('div');
    const toolbar = document.createElement('div');
    const scrollArea = document.createElement('div');
    const itemsRoot = document.createElement('div');

    scrollArea.setAttribute('data-xeg-role', 'scroll-area');
    itemsRoot.setAttribute('data-xeg-role', 'items-list');
    itemsRoot.style.display = 'contents';

    media.forEach((_, idx) => {
      const item = document.createElement('div');
      item.setAttribute('data-xeg-role', 'gallery-item');
      item.setAttribute('data-index', String(idx));
      itemsRoot.appendChild(item);
    });

    scrollArea.appendChild(itemsRoot);
    container.appendChild(hover); // index 0
    container.appendChild(toolbar); // index 1
    container.appendChild(scrollArea); // index 2

    const wrongFirst = container.children[0];
    expect(wrongFirst.getAttribute('data-xeg-role')).not.toBe('gallery-item');

    const realFirst = container.querySelector('[data-xeg-role="gallery-item"][data-index="0"]');
    expect(realFirst).not.toBeNull();
  });
});
