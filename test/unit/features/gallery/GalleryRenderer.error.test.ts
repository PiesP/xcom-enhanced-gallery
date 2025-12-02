import { GalleryRenderer } from '@features/gallery/GalleryRenderer';
import { gallerySignals, setError } from '@shared/state/signals/gallery.signals';
import { logger } from '@shared/logging';

// Mock dependencies
vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock getSolid to throw on render
vi.mock('@shared/external/vendors', () => ({
  getSolid: () => ({
    render: vi.fn(() => {
      throw new Error('Render failed');
    }),
    createComponent: vi.fn(),
    createSignal: vi.fn(() => [() => {}, () => {}]),
    onCleanup: vi.fn(),
    createEffect: vi.fn(),
    lazy: vi.fn(),
    Suspense: vi.fn(),
  }),
}));

vi.mock('@shared/container/service-accessors', () => ({
  getThemeService: vi.fn().mockReturnValue({
    getCurrentTheme: vi.fn().mockReturnValue('auto'),
    onThemeChange: vi.fn().mockReturnValue(() => {}),
  }),
  getLanguageService: vi.fn().mockReturnValue({
    getCurrentLanguage: vi.fn().mockReturnValue('en'),
    onLanguageChange: vi.fn().mockReturnValue(() => {}),
  }),
}));

vi.mock('@shared/services/download/download-orchestrator', () => ({
  DownloadOrchestrator: {
    getInstance: vi.fn().mockReturnValue({}),
  },
}));

vi.mock('@shared/state/signals/gallery.signals', () => {
  const subscribers = new Set<(isOpen: boolean) => void>();
  const signals = {
    isOpen: {
      value: false,
      subscribe: vi.fn(cb => {
        subscribers.add(cb);
        return () => subscribers.delete(cb);
      }),
    },
    mediaItems: {
      value: [],
    },
    __triggerIsOpen: (isOpen: boolean) => {
      subscribers.forEach(cb => cb(isOpen));
    },
  };
  return {
    gallerySignals: signals,
    closeGallery: vi.fn(),
    setError: vi.fn(),
  };
});

describe('GalleryRenderer Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    new GalleryRenderer();
  });

  it('should handle rendering errors gracefully', () => {
    // Setup mock state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (gallerySignals.mediaItems as any).value = [{ id: '1' }];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (gallerySignals.isOpen as any).value = true;

    // Trigger subscription
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (gallerySignals as any).__triggerIsOpen(true);

    // Should log error
    expect(logger.error).toHaveBeenCalledWith(
      '[GalleryRenderer] Rendering failed:',
      expect.any(Error)
    );

    // Should set error state
    expect(setError).toHaveBeenCalledWith('Gallery rendering failed');
  });
});
