import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { waitFor } from '@test-utils/testing-library';
import { GalleryRenderer } from '@/features/gallery/GalleryRenderer';
import { CoreService } from '@shared/services/ServiceManager';
import { SERVICE_KEYS } from '@/constants';
import { setFeatureFlagOverride, resetFeatureFlagOverrides } from '@shared/config/feature-flags';
import { closeGallery, galleryState } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';

function createMediaFixture(id: string): MediaInfo {
  return {
    id,
    url: `https://pbs.twimg.com/media/${id}?format=jpg&name=orig`,
    filename: `${id}.jpg`,
    type: 'image',
  };
}

const MEDIA_ITEMS: readonly MediaInfo[] = [
  createMediaFixture('AAA111'),
  createMediaFixture('BBB222'),
  createMediaFixture('CCC333'),
];

function registerMediaServiceStub(): () => void {
  CoreService.resetInstance();
  const services = CoreService.getInstance();

  services.register(SERVICE_KEYS.MEDIA_SERVICE, {
    async prepareForGallery() {
      /* no-op for tests */
    },
    restoreBackgroundVideos() {
      /* no-op */
    },
  });

  return () => {
    CoreService.resetInstance();
  };
}

describe('FRAME-ALT-001 Stage E — Solid shell UI parity', () => {
  let renderer: GalleryRenderer;
  let restoreServices: () => void;

  beforeEach(() => {
    document.body.innerHTML = '';
    galleryState.value = {
      ...galleryState.value,
      isOpen: false,
      mediaItems: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
    };

    resetFeatureFlagOverrides();
    setFeatureFlagOverride('solidGalleryShell', true);

    restoreServices = registerMediaServiceStub();
    renderer = new GalleryRenderer();
  });

  afterEach(() => {
    try {
      closeGallery();
    } catch {
      /* ignore */
    }

    try {
      renderer.destroy();
    } catch {
      /* ignore */
    }

    restoreServices();
    resetFeatureFlagOverrides();

    const root = document.querySelector('#xeg-gallery-root');
    if (root?.parentNode) {
      root.parentNode.removeChild(root);
    }
  });

  it('mounts Solid gallery inside isolated gallery container with shared UI primitives', async () => {
    await renderer.render(MEDIA_ITEMS, { startIndex: 1 });

    const galleryRoot = await waitFor(() => {
      const node = document.querySelector('#xeg-gallery-root') as HTMLElement | null;
      if (!node) {
        throw new Error('Gallery root not found');
      }
      if (!node.classList.contains('xeg-root')) {
        throw new Error('Gallery root missing xeg-root class');
      }
      return node;
    });

    expect(galleryRoot.getAttribute('data-renderer')).toBe('gallery');
    expect(galleryRoot.getAttribute('data-renderer-impl')).toBe('solid');

    // Light DOM 모드: shadowRoot 확인 불필요
    const host = galleryRoot as HTMLElement;

    const galleryContainer = host.querySelector('.gallery-container');
    expect(galleryContainer).not.toBeNull();

    const toolbar = host.querySelector('[data-gallery-element="toolbar"]');
    expect(toolbar).not.toBeNull();

    const itemsContainer = host.querySelector('[data-xeg-role="items-container"]');
    expect(itemsContainer).not.toBeNull();

    const items = host.querySelectorAll('[data-xeg-component="vertical-image-item"]');
    expect(items.length).toBe(MEDIA_ITEMS.length);

    items.forEach(item => {
      expect(item.getAttribute('data-xeg-gallery')).toBe('true');
    });
  });
});
