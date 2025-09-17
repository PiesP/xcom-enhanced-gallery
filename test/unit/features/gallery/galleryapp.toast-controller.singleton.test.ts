import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock container accessors used by GalleryApp
vi.mock('@shared/container/service-accessors', () => {
  const toast = {
    initialize: vi.fn(async () => {}),
    show: vi.fn(() => {}),
  };
  return {
    getToastController: vi.fn(() => toast),
    tryGetToastController: vi.fn(() => toast),
    getGalleryRenderer: vi.fn(() => ({
      setOnCloseCallback: vi.fn(() => {}),
    })),
    getMediaServiceFromContainer: vi.fn(() => ({})),
  };
});

// Avoid wiring actual global events in GalleryApp.initialize
import { GalleryApp } from '@/features/gallery/GalleryApp';
import * as accessors from '@shared/container/service-accessors';

describe('GalleryApp initializes ToastController exactly once', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getToastController only once even when initialize() is invoked twice', async () => {
    // Stub out setupEventHandlers to avoid dynamic events import side-effects
    const setupSpy = vi
      .spyOn(
        GalleryApp.prototype as unknown as { setupEventHandlers: () => Promise<void> },
        'setupEventHandlers'
      )
      .mockResolvedValue();

    const app = new GalleryApp();
    await app.initialize();
    await app.initialize();

    expect((accessors as any).getToastController).toHaveBeenCalledTimes(1);
    expect(setupSpy).toHaveBeenCalledTimes(2); // initialize twice still calls setup, but toast creation stays once
  });
});
