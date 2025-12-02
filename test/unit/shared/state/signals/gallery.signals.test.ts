import {
  closeGallery,
  gallerySignals,
  galleryState,
  getCurrentIndex,
  getCurrentMediaItem,
  getError,
  getMediaItems,
  getMediaItemsCount,
  getNavigationState,
  getLastNavigationSource,
  galleryIndexEvents,
  getViewMode,
  hasMediaItems,
  hasNextMedia,
  hasPreviousMedia,
  isGalleryOpen,
  isLoading,
  navigateNext,
  navigatePrevious,
  navigateToItem,
  openGallery,
  setError,
  setFocusedIndex,
  setLoading,
  setViewMode,
} from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';

// Mock solid-hooks with real Solid.js implementation
vi.mock('@shared/external/vendors/solid-hooks', async () => {
  const Solid = await import('solid-js');
  return {
    createSignal: Solid.createSignal,
    createEffect: Solid.createEffect,
    createMemo: Solid.createMemo,
    createRoot: Solid.createRoot,
    batch: Solid.batch,
  };
});

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Gallery Signals', () => {
  const mockMediaItems: MediaInfo[] = [
    {
      id: '1',
      url: 'url1',
      type: 'image',
      originalUrl: 'url1',
      thumbnailUrl: 'url1',
    },
    {
      id: '2',
      url: 'url2',
      type: 'video',
      originalUrl: 'url2',
      thumbnailUrl: 'url2',
    },
    {
      id: '3',
      url: 'url3',
      type: 'image',
      originalUrl: 'url3',
      thumbnailUrl: 'url3',
    },
  ];

  beforeEach(() => {
    closeGallery();
    setViewMode('vertical');
    vi.clearAllMocks();
  });

  describe('Actions', () => {
    it('should open gallery', () => {
      openGallery(mockMediaItems, 1);
      expect(gallerySignals.isOpen.value).toBe(true);
      expect(gallerySignals.mediaItems.value).toEqual(mockMediaItems);
      expect(gallerySignals.currentIndex.value).toBe(1);
      expect(gallerySignals.focusedIndex.value).toBe(1);
    });

    it('should close gallery', () => {
      openGallery(mockMediaItems);
      closeGallery();
      expect(gallerySignals.isOpen.value).toBe(false);
      expect(gallerySignals.mediaItems.value).toEqual([]);
      expect(gallerySignals.currentIndex.value).toBe(0);
      expect(gallerySignals.focusedIndex.value).toBeNull();
    });

    it('should navigate to item', () => {
      openGallery(mockMediaItems);
      navigateToItem(2);
      expect(gallerySignals.currentIndex.value).toBe(2);
      expect(gallerySignals.focusedIndex.value).toBe(2);
    });

    it('should navigate next', () => {
      openGallery(mockMediaItems, 0);
      navigateNext();
      expect(gallerySignals.currentIndex.value).toBe(1);
    });

    it('should navigate next (loop)', () => {
      openGallery(mockMediaItems, 2);
      navigateNext();
      expect(gallerySignals.currentIndex.value).toBe(0);
    });

    it('should navigate previous', () => {
      openGallery(mockMediaItems, 1);
      navigatePrevious();
      expect(gallerySignals.currentIndex.value).toBe(0);
    });

    it('should navigate previous (loop)', () => {
      openGallery(mockMediaItems, 0);
      navigatePrevious();
      expect(gallerySignals.currentIndex.value).toBe(2);
    });

    it('should set loading', () => {
      setLoading(true);
      expect(gallerySignals.isLoading.value).toBe(true);
    });

    it('should set error', () => {
      setError('Test error');
      expect(gallerySignals.error.value).toBe('Test error');
      expect(gallerySignals.isLoading.value).toBe(false);
    });

    it('should set view mode', () => {
      setViewMode('horizontal');
      expect(gallerySignals.viewMode.value).toBe('horizontal');
    });

    it('should set focused index', () => {
      openGallery(mockMediaItems);
      setFocusedIndex(2);
      expect(gallerySignals.focusedIndex.value).toBe(2);
    });
  });

  describe('Selectors', () => {
    beforeEach(() => {
      openGallery(mockMediaItems, 1);
    });

    it('should get current media item', () => {
      expect(getCurrentMediaItem()).toEqual(mockMediaItems[1]);
    });

    it('should check if has media items', () => {
      expect(hasMediaItems()).toBe(true);
    });

    it('should get media items count', () => {
      expect(getMediaItemsCount()).toBe(3);
    });

    it('should check previous/next media', () => {
      expect(hasPreviousMedia()).toBe(true);
      expect(hasNextMedia()).toBe(true);
    });

    it('should expose state accessors', () => {
      expect(isGalleryOpen()).toBe(true);
      expect(getCurrentIndex()).toBe(1);
      expect(getMediaItems()).toEqual(mockMediaItems);
      expect(isLoading()).toBe(false);
      expect(getError()).toBeNull();
      expect(getViewMode()).toBe('vertical');
    });
  });

  describe('Navigation events', () => {
    it('should emit navigation events and update navigation state', () => {
      const startCallback = vi.fn();
      const completeCallback = vi.fn();
      const unsubscribeStart = galleryIndexEvents.on('navigate:start', startCallback);
      const unsubscribeComplete = galleryIndexEvents.on('navigate:complete', completeCallback);

      openGallery(mockMediaItems, 0);
      navigateToItem(2, 'keyboard', 'keyboard');

      expect(startCallback).toHaveBeenCalledWith({ from: 0, to: 2, trigger: 'keyboard' });
      expect(completeCallback).toHaveBeenCalledWith({ index: 2, trigger: 'keyboard' });
      expect(getLastNavigationSource()).toBe('keyboard');
      expect(getNavigationState().lastNavigatedIndex).toBe(2);

      unsubscribeStart();
      unsubscribeComplete();
    });
  });

  describe('Backward Compatibility', () => {
    it('should get state value', () => {
      openGallery(mockMediaItems);
      const state = galleryState.value;
      expect(state.isOpen).toBe(true);
      expect(state.mediaItems).toEqual(mockMediaItems);
    });

    it('should set state value', () => {
      galleryState.value = {
        isOpen: true,
        mediaItems: mockMediaItems,
        currentIndex: 2,
        isLoading: true,
        error: 'error',
        viewMode: 'horizontal',
      };

      expect(gallerySignals.isOpen.value).toBe(true);
      expect(gallerySignals.mediaItems.value).toEqual(mockMediaItems);
      expect(gallerySignals.currentIndex.value).toBe(2);
      expect(gallerySignals.isLoading.value).toBe(true);
      expect(gallerySignals.error.value).toBe('error');
      expect(gallerySignals.viewMode.value).toBe('horizontal');
    });
  });
});
