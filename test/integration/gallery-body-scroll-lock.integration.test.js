/* eslint-env browser */
/* globals document, setTimeout */
/**
 * Full VerticalGalleryView integration test (body scroll lock behavior)
 * 목표: 갤러리 열림 시 body overflow hidden, 닫힘 시 복원.
 * NOTE: TS 파서 문제 회피 위해 순수 JS로 작성.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/preact';
import { getPreact } from '@shared/external/vendors';
import { galleryState } from '@shared/state/signals/gallery.signals';

// IntersectionObserver 최소 mock (중복 정의 방지)
if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = class {
    constructor() {
      this.root = null;
      this.rootMargin = '0px';
      this.thresholds = [0];
    }
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  };
}

describe('Integration: VerticalGalleryView Body Scroll Lock', () => {
  const originalOverflow = { body: '', html: '' };

  beforeEach(() => {
    originalOverflow.body = document.body.style.overflow;
    originalOverflow.html = document.documentElement.style.overflow;
    galleryState.value = { ...galleryState.value, mediaItems: [], currentIndex: 0 };
  });

  afterEach(() => {
    cleanup();
    document.body.style.overflow = originalOverflow.body;
    document.documentElement.style.overflow = originalOverflow.html;
  });

  it('갤러리 열리면 body overflow hidden 적용 (feature flag 활성)', async () => {
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );
    const { h } = getPreact();

    galleryState.value = {
      ...galleryState.value,
      mediaItems: [
        {
          id: 'm1',
          url: 'https://example.com/1.jpg',
          type: 'image',
          width: 100,
          height: 100,
          filename: '1.jpg',
        },
      ],
      currentIndex: 0,
    };

    render(h(VerticalGalleryView, {}));
    await new Promise(r => setTimeout(r, 10));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('갤러리 닫히면 body overflow 복원', async () => {
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );
    const { h } = getPreact();

    galleryState.value = {
      ...galleryState.value,
      mediaItems: [
        {
          id: 'm1',
          url: 'https://example.com/1.jpg',
          type: 'image',
          width: 100,
          height: 100,
          filename: '1.jpg',
        },
      ],
      currentIndex: 0,
    };

    const utils = render(h(VerticalGalleryView, {}));
    await new Promise(r => setTimeout(r, 10));
    expect(document.body.style.overflow).toBe('hidden');

    galleryState.value = { ...galleryState.value, mediaItems: [], currentIndex: 0 };
    await new Promise(r => setTimeout(r, 10));
    expect(document.body.style.overflow === 'hidden').toBe(false);

    utils.unmount();
  });
});
