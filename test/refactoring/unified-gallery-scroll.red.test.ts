import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { galleryState } from '@shared/state/signals/gallery.signals';

// RED: 아직 훅이 존재하지 않아 import 시 오류가 발생해야 함

describe('useUnifiedGalleryScroll 통합 훅 (Phase 1 Adapter)', () => {
  beforeEach(() => {
    galleryState.value.isOpen = true as any;
  });

  afterEach(() => {
    galleryState.value.isOpen = false as any;
  });

  it('기본 스크롤 처리: enableItemNavigation=false → 아이템 API 미노출', async () => {
    const { useUnifiedGalleryScroll } = await import(
      '@/features/gallery/hooks/use-unified-gallery-scroll'
    );
    const container = document.createElement('div');
    const hookResult = useUnifiedGalleryScroll({
      container,
      enableScrollDirection: true,
      enableItemNavigation: false,
    });
    expect(Boolean(hookResult.isScrolling)).toBe(false);
    expect(hookResult.scrollToItem).toBeUndefined();
  });

  it('아이템 내비게이션 활성화 시 scrollToItem / scrollToCurrentItem 제공', async () => {
    const { useUnifiedGalleryScroll } = await import(
      '@/features/gallery/hooks/use-unified-gallery-scroll'
    );
    const container = document.createElement('div');
    const itemsList = document.createElement('div');
    itemsList.setAttribute('data-xeg-role', 'items-list');
    for (let i = 0; i < 3; i++) {
      itemsList.appendChild(document.createElement('div'));
    }
    container.appendChild(itemsList);
    const hookResult = useUnifiedGalleryScroll({
      container,
      enableItemNavigation: true,
      currentIndex: 1,
      totalItems: 3,
    });
    expect(typeof hookResult.scrollToItem).toBe('function');
    expect(typeof hookResult.scrollToCurrentItem).toBe('function');
  });
});
