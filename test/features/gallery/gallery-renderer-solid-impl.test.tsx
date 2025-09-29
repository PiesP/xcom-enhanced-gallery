import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@test-utils/testing-library';
import { GalleryRenderer } from '@/features/gallery/GalleryRenderer';
import { CoreService } from '@shared/services/ServiceManager';
import { SERVICE_KEYS } from '@/constants';
import { closeGallery } from '@shared/state/signals/gallery.signals';
import { setFeatureFlagOverride, resetFeatureFlagOverrides } from '@shared/config/feature-flags';

describe('GalleryRenderer implementation marker', () => {
  const mediaItems = [
    {
      id: 'm-1',
      url: 'https://example.com/1.jpg',
      type: 'image' as const,
      filename: '1.jpg',
    },
  ];

  let renderer: GalleryRenderer | null = null;

  beforeEach(() => {
    CoreService.resetInstance();
    const services = CoreService.getInstance();
    services.register(SERVICE_KEYS.MEDIA_SERVICE, {
      prepareForGallery: async () => undefined,
      restoreBackgroundVideos: () => undefined,
    });
    renderer = new GalleryRenderer();
    resetFeatureFlagOverrides();
  });

  afterEach(() => {
    try {
      closeGallery();
      renderer?.destroy();
    } finally {
      renderer = null;
      resetFeatureFlagOverrides();
      const nodes = Array.from(document.querySelectorAll('.xeg-gallery-renderer'));
      nodes.forEach(node => node.remove());
      CoreService.resetInstance();
    }
  });

  it('marks the gallery container with the solid implementation by default', async () => {
    const instance = renderer!;

    await instance.render(mediaItems);

    await waitFor(() => {
      expect(document.querySelector('.xeg-gallery-renderer')).toBeTruthy();
    });

    const container = document.querySelector('.xeg-gallery-renderer');

    await waitFor(() => {
      expect(container?.getAttribute('data-renderer-impl')).toBe('solid');
      const shadowRoot = container?.shadowRoot;
      expect(shadowRoot?.querySelector('[data-xeg-solid-shell]')).toBeTruthy();
      expect(container?.querySelector('[data-xeg-toolbar-settings-host]')).toBeFalsy();
    });
  });

  it('falls back to the preact implementation when Solid flag is explicitly disabled', async () => {
    const instance = renderer!;
    setFeatureFlagOverride('solidGalleryShell', false);

    await instance.render(mediaItems);

    await waitFor(() => {
      expect(document.querySelector('.xeg-gallery-renderer')).toBeTruthy();
    });

    const container = document.querySelector('.xeg-gallery-renderer');
    await waitFor(() => {
      expect(container?.getAttribute('data-renderer-impl')).toBe('preact');
      const shadowRoot = container?.shadowRoot;
      expect(shadowRoot?.querySelector('[data-xeg-solid-shell]')).toBeFalsy();
      expect(container?.querySelector('[data-xeg-toolbar-settings-host]')).toBeTruthy();
    });
  });
});
