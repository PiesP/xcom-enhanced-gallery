import {
  closeGallery,
  gallerySignals,
  getMediaItemsCount,
  hasMediaItems,
  hasNextMedia,
  hasPreviousMedia,
  navigateNext,
  navigatePrevious,
  navigateToItem,
  openGallery,
  setFocusedIndex,
} from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';

// Mock dependencies
vi.mock('@shared/external/vendors', async () => {
  const Solid = await import('solid-js');
  return {
    getSolid: () => Solid,
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

describe('Gallery Signals - Boundary Tests', () => {
  const mockMediaItems: MediaInfo[] = [
    { id: '1', url: 'url1', type: 'image', originalUrl: 'url1', thumbnailUrl: 'url1' },
    { id: '2', url: 'url2', type: 'video', originalUrl: 'url2', thumbnailUrl: 'url2' },
    { id: '3', url: 'url3', type: 'image', originalUrl: 'url3', thumbnailUrl: 'url3' },
  ];

  beforeEach(() => {
    closeGallery();
    vi.clearAllMocks();
  });

  it('should clamp negative start index to 0', () => {
    openGallery(mockMediaItems, -1);
    expect(gallerySignals.currentIndex.value).toBe(0);
  });

  it('should clamp start index greater than length to last index', () => {
    openGallery(mockMediaItems, 10);
    expect(gallerySignals.currentIndex.value).toBe(2); // length is 3, last index is 2
  });

  it('should handle empty items list', () => {
    openGallery([], 0);
    expect(gallerySignals.mediaItems.value).toEqual([]);
    expect(gallerySignals.currentIndex.value).toBe(0);
  });

  it('should use default start index 0', () => {
    openGallery(mockMediaItems);
    expect(gallerySignals.currentIndex.value).toBe(0);
  });
});

describe('Gallery Signals - Navigation Source Coverage', () => {
  const mockMediaItems: MediaInfo[] = [
    { id: '1', url: 'url1', type: 'image', originalUrl: 'url1', thumbnailUrl: 'url1' },
    { id: '2', url: 'url2', type: 'video', originalUrl: 'url2', thumbnailUrl: 'url2' },
    { id: '3', url: 'url3', type: 'image', originalUrl: 'url3', thumbnailUrl: 'url3' },
  ];

  beforeEach(() => {
    closeGallery();
    vi.clearAllMocks();
  });

  describe('navigatePrevious trigger variations', () => {
    it('should navigate with button trigger (default)', () => {
      openGallery(mockMediaItems, 1);
      navigatePrevious();
      expect(gallerySignals.currentIndex.value).toBe(0);
    });

    it('should navigate with keyboard trigger', () => {
      openGallery(mockMediaItems, 1);
      navigatePrevious('keyboard');
      expect(gallerySignals.currentIndex.value).toBe(0);
    });

    it('should navigate with click trigger', () => {
      openGallery(mockMediaItems, 1);
      navigatePrevious('click');
      expect(gallerySignals.currentIndex.value).toBe(0);
    });

    it('should navigate with scroll trigger', () => {
      openGallery(mockMediaItems, 1);
      navigatePrevious('scroll');
      expect(gallerySignals.currentIndex.value).toBe(0);
    });
  });

  describe('navigateNext trigger variations', () => {
    it('should navigate with button trigger (default)', () => {
      openGallery(mockMediaItems, 0);
      navigateNext();
      expect(gallerySignals.currentIndex.value).toBe(1);
    });

    it('should navigate with keyboard trigger', () => {
      openGallery(mockMediaItems, 0);
      navigateNext('keyboard');
      expect(gallerySignals.currentIndex.value).toBe(1);
    });

    it('should navigate with click trigger', () => {
      openGallery(mockMediaItems, 0);
      navigateNext('click');
      expect(gallerySignals.currentIndex.value).toBe(1);
    });

    it('should navigate with scroll trigger', () => {
      openGallery(mockMediaItems, 0);
      navigateNext('scroll');
      expect(gallerySignals.currentIndex.value).toBe(1);
    });
  });

  describe('navigateToItem trigger variations', () => {
    it('should navigate with button trigger', () => {
      openGallery(mockMediaItems, 0);
      navigateToItem(2, 'button', 'button');
      expect(gallerySignals.currentIndex.value).toBe(2);
    });

    it('should navigate with keyboard trigger and source', () => {
      openGallery(mockMediaItems, 0);
      navigateToItem(2, 'keyboard', 'keyboard');
      expect(gallerySignals.currentIndex.value).toBe(2);
    });
  });
});

describe('Gallery Signals - Media Items Length Conditions', () => {
  beforeEach(() => {
    closeGallery();
    vi.clearAllMocks();
  });

  it('hasMediaItems returns false for empty gallery', () => {
    openGallery([], 0);
    expect(hasMediaItems()).toBe(false);
    expect(getMediaItemsCount()).toBe(0);
  });

  it('hasMediaItems returns true for single item', () => {
    openGallery([{ id: '1', url: 'url1', type: 'image', originalUrl: 'url1', thumbnailUrl: 'url1' }], 0);
    expect(hasMediaItems()).toBe(true);
    expect(getMediaItemsCount()).toBe(1);
  });

  it('hasPreviousMedia/hasNextMedia returns false for single item', () => {
    openGallery([{ id: '1', url: 'url1', type: 'image', originalUrl: 'url1', thumbnailUrl: 'url1' }], 0);
    expect(hasPreviousMedia()).toBe(false);
    expect(hasNextMedia()).toBe(false);
  });

  it('hasPreviousMedia/hasNextMedia returns true for multiple items', () => {
    openGallery([
      { id: '1', url: 'url1', type: 'image', originalUrl: 'url1', thumbnailUrl: 'url1' },
      { id: '2', url: 'url2', type: 'image', originalUrl: 'url2', thumbnailUrl: 'url2' },
    ], 0);
    expect(hasPreviousMedia()).toBe(true);
    expect(hasNextMedia()).toBe(true);
  });
});

describe('Gallery Signals - FocusedIndex Edge Cases', () => {
  const mockMediaItems: MediaInfo[] = [
    { id: '1', url: 'url1', type: 'image', originalUrl: 'url1', thumbnailUrl: 'url1' },
    { id: '2', url: 'url2', type: 'video', originalUrl: 'url2', thumbnailUrl: 'url2' },
    { id: '3', url: 'url3', type: 'image', originalUrl: 'url3', thumbnailUrl: 'url3' },
  ];

  beforeEach(() => {
    closeGallery();
    vi.clearAllMocks();
  });

  it('should use focusedIndex in navigatePrevious when set', () => {
    openGallery(mockMediaItems, 0);
    setFocusedIndex(2);
    navigatePrevious('keyboard');
    // Should navigate from focusedIndex (2) to 1
    expect(gallerySignals.currentIndex.value).toBe(1);
  });

  it('should use focusedIndex in navigateNext when set', () => {
    openGallery(mockMediaItems, 0);
    setFocusedIndex(1);
    navigateNext('keyboard');
    // Should navigate from focusedIndex (1) to 2
    expect(gallerySignals.currentIndex.value).toBe(2);
  });

  it('should fallback to currentIndex when focusedIndex is null', () => {
    openGallery(mockMediaItems, 1);
    setFocusedIndex(null);
    navigateNext('button');
    // Should navigate from currentIndex (1) to 2
    expect(gallerySignals.currentIndex.value).toBe(2);
  });

  it('should clamp setFocusedIndex to valid range', () => {
    openGallery(mockMediaItems, 0);
    setFocusedIndex(100);
    expect(gallerySignals.focusedIndex.value).toBe(2); // Clamped to last index
  });

  it('should handle negative index in setFocusedIndex', () => {
    openGallery(mockMediaItems, 0);
    setFocusedIndex(-5);
    expect(gallerySignals.focusedIndex.value).toBe(0); // Clamped to 0
  });
});
