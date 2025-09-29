import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  galleryState,
  openGallery,
  closeGallery,
  navigateNext,
  setError,
} from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';

const createMediaItem = (overrides: Partial<MediaInfo> = {}): MediaInfo => ({
  id: overrides.id ?? 'media-1',
  url: overrides.url ?? 'https://example.com/media.jpg',
  type: overrides.type ?? 'image',
  filename: overrides.filename ?? 'media.jpg',
  ...overrides,
});

const resetGalleryState = () => {
  galleryState.value = {
    isOpen: false,
    mediaItems: [],
    currentIndex: 0,
    isLoading: false,
    error: null,
    viewMode: 'vertical',
  };
};

describe('galleryState Solid integration', () => {
  beforeEach(() => {
    resetGalleryState();
  });

  it('exposes a Solid accessor that reflects state changes', () => {
    const initialAccessorValue = galleryState.accessor();
    expect(initialAccessorValue.isOpen).toBe(false);

    const items = [createMediaItem({ id: 'media-1' }), createMediaItem({ id: 'media-2' })];
    openGallery(items, 1);

    const nextState = galleryState.accessor();
    expect(nextState.isOpen).toBe(true);
    expect(nextState.mediaItems).toHaveLength(2);
    expect(nextState.currentIndex).toBe(1);
  });

  it('notifies subscribers when the gallery state changes', () => {
    const items = [createMediaItem({ id: 'media-a' }), createMediaItem({ id: 'media-b' })];
    openGallery(items, 0);

    const listener = vi.fn();
    const unsubscribe = galleryState.subscribe(listener);

    navigateNext();
    setError('example');

    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    closeGallery();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('allows direct value updates through the global signal', () => {
    galleryState.value = {
      isOpen: true,
      mediaItems: [createMediaItem({ id: 'media-3' })],
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    };

    const snapshot = galleryState.peek();
    expect(snapshot.isOpen).toBe(true);
    expect(snapshot.mediaItems[0]?.id).toBe('media-3');
  });
});
