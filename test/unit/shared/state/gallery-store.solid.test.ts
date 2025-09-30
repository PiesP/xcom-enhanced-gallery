import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSolidCore } from '@shared/external/vendors';

import {
  galleryState,
  setGalleryState,
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
  setGalleryState({
    isOpen: false,
    mediaItems: [],
    currentIndex: 0,
    isLoading: false,
    error: null,
    viewMode: 'vertical',
  });
};

describe('galleryState Solid integration', () => {
  beforeEach(() => {
    resetGalleryState();
  });

  it('exposes a Solid accessor that reflects state changes', () => {
    const initialAccessorValue = galleryState();
    expect(initialAccessorValue.isOpen).toBe(false);

    const items = [createMediaItem({ id: 'media-1' }), createMediaItem({ id: 'media-2' })];
    openGallery(items, 1);

    const nextState = galleryState();
    expect(nextState.isOpen).toBe(true);
    expect(nextState.mediaItems).toHaveLength(2);
    expect(nextState.currentIndex).toBe(1);
  });

  it('notifies subscribers when the gallery state changes', async () => {
    const items = [createMediaItem({ id: 'media-a' }), createMediaItem({ id: 'media-b' })];
    openGallery(items, 0);

    const solid = getSolidCore();
    const listener = vi.fn();

    // createEffect를 사용하여 구독
    let initialCallCount = 0;
    await new Promise<void>(resolve => {
      solid.createRoot(dispose => {
        solid.createEffect(() => {
          const state = galleryState();
          listener(state);
          initialCallCount = listener.mock.calls.length;
        });

        // 타이머로 다음 프레임까지 기다림
        setTimeout(() => {
          navigateNext();
          setError('example');

          setTimeout(() => {
            // 최소 3번 호출되어야 함: 초기 + navigateNext + setError
            expect(listener).toHaveBeenCalled();
            expect(listener.mock.calls.length).toBeGreaterThanOrEqual(3);

            const callCountBeforeDispose = listener.mock.calls.length;
            dispose();

            closeGallery();
            // dispose 후에는 호출되지 않음
            expect(listener.mock.calls.length).toBe(callCountBeforeDispose);

            resolve();
          }, 10);
        }, 10);
      });
    });
  });

  it('allows direct value updates through the native signal setter', () => {
    setGalleryState({
      isOpen: true,
      mediaItems: [createMediaItem({ id: 'media-3' })],
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    });

    const snapshot = galleryState();
    expect(snapshot.isOpen).toBe(true);
    expect(snapshot.mediaItems[0]?.id).toBe('media-3');
  });
});
