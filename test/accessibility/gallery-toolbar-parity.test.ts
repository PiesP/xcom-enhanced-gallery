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
      /* no-op */
    },
    restoreBackgroundVideos() {
      /* no-op */
    },
  });

  return () => {
    CoreService.resetInstance();
  };
}

function getShadowHost(): HTMLElement {
  const root = document.querySelector('#xeg-gallery-root') as HTMLElement | null;
  if (!root) {
    throw new Error('Gallery root not found');
  }
  const shadowContent = root.shadowRoot?.querySelector('[data-xeg-shadow-content="true"]');
  if (shadowContent instanceof HTMLElement) {
    return shadowContent;
  }
  return root;
}

describe('FRAME-ALT-001 Stage E — Gallery toolbar parity', () => {
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

  it('renders shared toolbar semantics and aria contract', async () => {
    await renderer.render(MEDIA_ITEMS, { startIndex: 0 });

    const host = await waitFor(() => {
      const node = getShadowHost();
      const toolbar = node.querySelector('[data-gallery-element="toolbar"]');
      if (!toolbar) {
        throw new Error('Toolbar element not found yet');
      }
      return node;
    });

    const toolbar = host.querySelector('[data-gallery-element="toolbar"]') as HTMLElement | null;
    expect(toolbar).not.toBeNull();
    expect(toolbar?.getAttribute('role')).toBe('toolbar');
    expect(toolbar?.getAttribute('aria-label')).toBe('갤러리 도구모음');

    const navPrevious = toolbar?.querySelector(
      '[data-gallery-element="nav-previous"]'
    ) as HTMLElement | null;
    const navNext = toolbar?.querySelector(
      '[data-gallery-element="nav-next"]'
    ) as HTMLElement | null;
    const downloadCurrent = toolbar?.querySelector(
      '[data-gallery-element="download-current"]'
    ) as HTMLElement | null;
    const downloadAll = toolbar?.querySelector(
      '[data-gallery-element="download-all"]'
    ) as HTMLElement | null;
    const closeButton = toolbar?.querySelector(
      '[data-gallery-element="close"]'
    ) as HTMLElement | null;

    expect(navPrevious?.getAttribute('aria-label')).toBe('이전 미디어');
    expect(navNext?.getAttribute('aria-label')).toBe('다음 미디어');
    expect(downloadCurrent?.getAttribute('aria-label')).toBe('현재 파일 다운로드');
    expect(downloadAll?.getAttribute('data-gallery-element')).toBe('download-all');
    expect(closeButton?.getAttribute('aria-label')).toBe('갤러리 닫기');

    const counterSection = toolbar?.querySelector('[data-gallery-element="counter-section"]');
    expect(counterSection).not.toBeNull();
    expect(counterSection?.querySelector('[data-gallery-element="counter"]')).not.toBeNull();
  });
});
