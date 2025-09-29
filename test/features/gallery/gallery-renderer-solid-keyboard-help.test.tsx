import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@test-utils/testing-library';
import { GalleryRenderer } from '@/features/gallery/GalleryRenderer';
import { CoreService } from '@shared/services/ServiceManager';
import { SERVICE_KEYS } from '@/constants';
import { closeGallery } from '@shared/state/signals/gallery.signals';
import { resetFeatureFlagOverrides } from '@shared/config/feature-flags';

const mediaItems = [
  {
    id: 'media-1',
    url: 'https://example.com/media-1.jpg',
    type: 'image' as const,
    filename: 'media-1.jpg',
  },
];

describe('GalleryRenderer keyboard help overlay (Solid path)', () => {
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
    }
  });

  it("opens the help overlay when '?' is pressed and closes on Escape", async () => {
    const instance = renderer!;

    await instance.render(mediaItems);

    await waitFor(() => {
      expect(document.querySelector('.xeg-gallery-renderer')).toBeTruthy();
      expect(document.querySelector('[data-renderer-impl="solid"]')).toBeTruthy();
    });

    const doc = document;
    const overlayHost = doc.querySelector('[data-xeg-solid-help-overlay]');
    expect(overlayHost).toBeTruthy();
    expect(overlayHost?.querySelector('[role="dialog"]')).toBeFalsy();

    const keyQuestion = new KeyboardEvent('keydown', {
      key: '?',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    doc.dispatchEvent(keyQuestion);

    await waitFor(() => {
      const overlay = doc.querySelector('[data-xeg-solid-help-overlay] [role="dialog"]');
      expect(overlay).toBeTruthy();
    });

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    doc.dispatchEvent(escapeEvent);

    await waitFor(() => {
      const overlay = doc.querySelector('[data-xeg-solid-help-overlay] [role="dialog"]');
      expect(overlay).toBeFalsy();
    });
  });
});
