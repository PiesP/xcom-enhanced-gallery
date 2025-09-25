import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { galleryState, openGallery, closeGallery } from '@/shared/state/signals/gallery.signals';
import { GalleryRenderer } from '@/features/gallery/GalleryRenderer';
import { CoreService } from '@shared/services/ServiceManager';
import { SERVICE_KEYS } from '@/constants';

/**
 * RED: SPA DOM 교체 시 컨테이너 분실 → 250ms 내 자동 재바인드 확인
 */

describe('[RED] mutation observer rebind', () => {
  beforeEach(() => {
    CoreService.resetInstance();
    const serviceManager = CoreService.getInstance();
    serviceManager.register(SERVICE_KEYS.MEDIA_SERVICE, {
      prepareForGallery: async () => undefined,
      restoreBackgroundVideos: () => undefined,
    });
    document.body.innerHTML = '';
  });

  afterEach(() => {
    CoreService.resetInstance();
  });

  it('컨테이너 제거 후 자동 재마운트 (≤250ms)', async () => {
    const renderer = new GalleryRenderer();
    const media = [
      { id: '1', url: 'https://pbs.twimg.com/media/abc.jpg', type: 'image', filename: 'a.jpg' },
    ];
    await renderer.render(media, { startIndex: 0, viewMode: 'vertical' });

    expect(galleryState.value.isOpen).toBe(true);
    // 컨테이너 존재 확인
    const initial = document.querySelector('.xeg-gallery-renderer');
    expect(initial).not.toBeNull();

    // 컨테이너 제거 (SPA DOM 교체 시뮬레이션)
    initial?.remove();

    // 시간 경과 시뮬레이션
    await new Promise(res => setTimeout(res, 200));

    const remounted = document.querySelector('.xeg-gallery-renderer');
    expect(remounted).not.toBeNull();

    // 정리
    closeGallery();
  });
});
