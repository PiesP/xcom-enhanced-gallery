import type { MediaInfo } from '@/shared/types/media.types';

// Mock dependencies
vi.mock('@/shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

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

describe('Gallery Signals Coverage', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let gallerySignalsModule: any;

  const createMediaItem = (id: string): MediaInfo => ({
    id,
    url: `url${id}`,
    originalUrl: `url${id}`,
    thumbnailUrl: `thumb${id}`,
    type: 'image',
  });

  beforeEach(async () => {
    vi.resetModules();
    gallerySignalsModule = await import('@/shared/state/signals/gallery.signals');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle duplicate navigation', async () => {
    const { navigateToItem, openGallery } = gallerySignalsModule;
    const items: MediaInfo[] = [createMediaItem('1'), createMediaItem('2')];

    openGallery(items, 0);

    // Navigate to 1
    navigateToItem(1, 'button', 'button');

    // Navigate to 1 again
    navigateToItem(1, 'button', 'button');

    // Should log debug message about duplicate
    const { logger } = await import('@/shared/logging');
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Already at index 1'));
  });

  it('should handle setFocusedIndex(null)', async () => {
    const { setFocusedIndex, gallerySignals } = gallerySignalsModule;

    setFocusedIndex(null);

    expect(gallerySignals.focusedIndex.value).toBeNull();

    const { logger } = await import('@/shared/logging');
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('focusedIndex cleared'));
  });

  it('should subscribe to state changes', () => {
    const { galleryState } = gallerySignalsModule;
    const callback = vi.fn();

    galleryState.subscribe(callback);

    // Since we mocked createEffect to run immediately, callback should be called
    expect(callback).toHaveBeenCalled();
  });

  it('should use Solid batch for state updates', async () => {
    const { galleryState, openGallery, closeGallery } = gallerySignalsModule;
    const items: MediaInfo[] = [createMediaItem('1'), createMediaItem('2')];

    openGallery(items, 0);
    expect(galleryState.value.isOpen).toBe(true);
    expect(galleryState.value.mediaItems.length).toBe(2);

    closeGallery();
    expect(galleryState.value.isOpen).toBe(false);
  });
});
