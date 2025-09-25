/**
 * @file Vertical Gallery DOM structure
 * 목표: 중복 래퍼/클래스 제거 검증 (GREEN)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GalleryRenderer } from '@/features/gallery/GalleryRenderer';
import { closeGallery } from '@/shared/state/signals/gallery.signals';
import { CoreService } from '@shared/services/ServiceManager';
import { SERVICE_KEYS } from '@/constants';

describe('Vertical Gallery DOM – overlay/renderer class deduplication', () => {
  let renderer: GalleryRenderer | null = null;

  beforeEach(() => {
    CoreService.resetInstance();
    const serviceManager = CoreService.getInstance();
    serviceManager.register(SERVICE_KEYS.MEDIA_SERVICE, {
      prepareForGallery: async () => undefined,
      restoreBackgroundVideos: () => undefined,
    });
    renderer = new GalleryRenderer();
  });

  afterEach(() => {
    try {
      closeGallery();
      renderer?.destroy();
    } finally {
      renderer = null;
      const nodes = Array.from(document.querySelectorAll('.xeg-gallery-renderer'));
      nodes.forEach(n => n.remove());
    }
    CoreService.resetInstance();
  });

  it('should render exactly one .xeg-gallery-renderer element', async () => {
    const items = [
      { id: 'm-1', url: 'https://example.com/1.jpg', type: 'image' as const, filename: '1.jpg' },
    ];

    await renderer!.render(items, { viewMode: 'vertical' });

    const overlays = document.querySelectorAll('.xeg-gallery-renderer');
    expect(overlays.length).toBe(1);
  });
});
