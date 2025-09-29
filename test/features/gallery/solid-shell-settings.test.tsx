import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GalleryRenderer } from '@/features/gallery/GalleryRenderer';
import { CoreService } from '@shared/services/ServiceManager';
import { SERVICE_KEYS } from '@/constants';
import { resetFeatureFlagOverrides, setFeatureFlagOverride } from '@shared/config/feature-flags';
import { closeGallery, galleryState } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { logger } from '@shared/logging/logger';

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

describe('FRAME-ALT-001 Stage E — Solid shell settings integration', () => {
  let renderer: GalleryRenderer;
  let restoreServices: () => void;
  let warnSpy: ReturnType<typeof vi.spyOn>;

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
    warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {
      /* suppress console noise during test */
    });
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

    warnSpy.mockRestore();
  });

  it('does not log missing settings service warnings when rendering Solid shell with defaults', async () => {
    await renderer.render(MEDIA_ITEMS, { startIndex: 0 });

    const hasSettingsWarning = warnSpy.mock.calls.some(call =>
      call.some(
        arg =>
          typeof arg === 'string' &&
          arg.includes('[ServiceManager]') &&
          arg.includes('settings.manager')
      )
    );

    expect(hasSettingsWarning).toBe(false);
  });
});
