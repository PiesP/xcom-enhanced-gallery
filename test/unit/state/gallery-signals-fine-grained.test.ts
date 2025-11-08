import { describe, it, expect, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { getSolid } from '@shared/external/vendors';
import { galleryState, gallerySignals } from '@/shared/state/signals/gallery.signals';
import type { MediaInfo } from '@/shared/types/media.types';

const { createRoot, createEffect } = getSolid();

describe('Gallery Fine-grained Signals', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    galleryState.value = {
      isOpen: false,
      mediaItems: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    };
  });

  it('should export gallerySignals API', () => {
    expect(gallerySignals).toBeDefined();
    expect(gallerySignals.currentIndex).toBeDefined();
    expect(gallerySignals.mediaItems).toBeDefined();
  });
});
