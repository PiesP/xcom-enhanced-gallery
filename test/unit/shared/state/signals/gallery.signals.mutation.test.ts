
// Mock solid-hooks with proper batch implementation
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

describe('Gallery Signals Mutation Tests - Batch Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should use Solid batch for state updates', async () => {
    const { openGallery, gallerySignals } = await import('@shared/state/signals/gallery.signals');

    openGallery([], 0);

    expect(gallerySignals.isOpen.value).toBe(true);
  });

  it('should handle batch updates correctly', async () => {
    const { openGallery, gallerySignals, galleryState } = await import('@shared/state/signals/gallery.signals');

    const mockMedia = [
      { id: '1', url: 'https://example.com/1.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
    ];

    openGallery(mockMedia, 0);

    expect(gallerySignals.isOpen.value).toBe(true);
    expect(galleryState.value.mediaItems.length).toBe(1);
  });
});

describe('Gallery Signals Mutation Tests - Initial State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should initialize isOpen to false', async () => {
    const { gallerySignals } = await import('@shared/state/signals/gallery.signals');
    // Initial state before any gallery operations
    expect(gallerySignals.isOpen.value).toBe(false);
  });

  it('should initialize mediaItems as empty array', async () => {
    const { galleryState } = await import('@shared/state/signals/gallery.signals');
    // Initial state should have empty mediaItems array
    expect(galleryState.value.mediaItems).toEqual([]);
    expect(galleryState.value.mediaItems.length).toBe(0);
  });

  it('should initialize isLoading to false', async () => {
    const { galleryState } = await import('@shared/state/signals/gallery.signals');
    expect(galleryState.value.isLoading).toBe(false);
  });
});

describe('Gallery Signals Mutation Tests - Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should navigate with button trigger to correct source', async () => {
    const { openGallery, navigateToItem, getLastNavigationSource, galleryState } =
      await import('@shared/state/signals/gallery.signals');

    const mockMedia = [
      { id: '1', url: 'https://example.com/1.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '2', url: 'https://example.com/2.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '3', url: 'https://example.com/3.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
    ];

    openGallery(mockMedia, 0);
    navigateToItem(1, 'button', 'button');

    expect(galleryState.value.currentIndex).toBe(1);
    expect(getLastNavigationSource()).toBe('button');
  });

  it('should navigate with keyboard trigger to keyboard source', async () => {
    const { openGallery, navigateToItem, getLastNavigationSource, galleryState } =
      await import('@shared/state/signals/gallery.signals');

    const mockMedia = [
      { id: '1', url: 'https://example.com/1.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '2', url: 'https://example.com/2.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
    ];

    openGallery(mockMedia, 0);
    navigateToItem(1, 'keyboard', 'keyboard');

    expect(galleryState.value.currentIndex).toBe(1);
    expect(getLastNavigationSource()).toBe('keyboard');
  });

  it('should navigate previous with button trigger correctly', async () => {
    const { openGallery, navigatePrevious, galleryState } =
      await import('@shared/state/signals/gallery.signals');

    const mockMedia = [
      { id: '1', url: 'https://example.com/1.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '2', url: 'https://example.com/2.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '3', url: 'https://example.com/3.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
    ];

    openGallery(mockMedia, 2);
    navigatePrevious('button');

    expect(galleryState.value.currentIndex).toBe(1);
  });

  it('should navigate next with button trigger correctly', async () => {
    const { openGallery, navigateNext, galleryState } =
      await import('@shared/state/signals/gallery.signals');

    const mockMedia = [
      { id: '1', url: 'https://example.com/1.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '2', url: 'https://example.com/2.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '3', url: 'https://example.com/3.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
    ];

    openGallery(mockMedia, 0);
    navigateNext('button');

    expect(galleryState.value.currentIndex).toBe(1);
  });

  it('should wrap around to last item when navigating previous from first', async () => {
    const { openGallery, navigatePrevious, galleryState } =
      await import('@shared/state/signals/gallery.signals');

    const mockMedia = [
      { id: '1', url: 'https://example.com/1.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '2', url: 'https://example.com/2.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '3', url: 'https://example.com/3.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
    ];

    openGallery(mockMedia, 0);
    navigatePrevious('keyboard');

    // Should wrap to last item (index 2)
    expect(galleryState.value.currentIndex).toBe(2);
  });

  it('should wrap around to first item when navigating next from last', async () => {
    const { openGallery, navigateNext, galleryState } =
      await import('@shared/state/signals/gallery.signals');

    const mockMedia = [
      { id: '1', url: 'https://example.com/1.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '2', url: 'https://example.com/2.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '3', url: 'https://example.com/3.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
    ];

    openGallery(mockMedia, 2);
    navigateNext('keyboard');

    // Should wrap to first item (index 0)
    expect(galleryState.value.currentIndex).toBe(0);
  });

  it('should clamp index to valid range in navigateToItem', async () => {
    const { openGallery, navigateToItem, galleryState } =
      await import('@shared/state/signals/gallery.signals');

    const mockMedia = [
      { id: '1', url: 'https://example.com/1.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '2', url: 'https://example.com/2.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
    ];

    openGallery(mockMedia, 0);

    // Try to navigate to index beyond array bounds
    navigateToItem(10, 'button');
    expect(galleryState.value.currentIndex).toBe(1); // Should clamp to last valid index

    // Try to navigate to negative index
    navigateToItem(-5, 'button');
    expect(galleryState.value.currentIndex).toBe(0); // Should clamp to 0
  });
});

describe('Gallery Signals Mutation Tests - Success Meta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should return success meta with items count', async () => {
    const { openGallery, galleryState } = await import('@shared/state/signals/gallery.signals');

    const mockMedia = [
      { id: '1', url: 'https://example.com/1.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '2', url: 'https://example.com/2.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
    ];

    openGallery(mockMedia, 0);

    // Verify state contains items
    expect(galleryState.value.mediaItems.length).toBe(2);
  });

  it('should return success meta with valid start index', async () => {
    const { openGallery, galleryState } = await import('@shared/state/signals/gallery.signals');

    const mockMedia = [
      { id: '1', url: 'https://example.com/1.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '2', url: 'https://example.com/2.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
      { id: '3', url: 'https://example.com/3.jpg', type: 'image' as const, originalUrl: '', thumbnailUrl: '' },
    ];

    openGallery(mockMedia, 1);

    expect(galleryState.value.currentIndex).toBe(1);
    expect(galleryState.value.mediaItems).toBe(mockMedia);
  });
});
