/**
 * @file Vertical Gallery DOM structure
 * 목표: 중복 래퍼/클래스 제거 검증 (GREEN)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { galleryRenderer as rendererSingleton } from '@/features/gallery/GalleryRenderer';
import { closeGallery } from '@/shared/state/signals/gallery.signals';

describe('Vertical Gallery DOM – overlay/renderer class deduplication', () => {
  let renderer: typeof rendererSingleton | null = null;

  beforeEach(() => {
    renderer = rendererSingleton;
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
