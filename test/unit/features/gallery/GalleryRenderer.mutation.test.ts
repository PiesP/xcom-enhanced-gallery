import { GalleryRenderer } from '@features/gallery/GalleryRenderer';
import { logger } from '@shared/logging';

// Mocks
const {
  mockSetError,
  mockCloseGallery,
  mockOpenGallery,
  mockNavigateNext,
  mockNavigatePrevious,
  mockIsOpen,
  mockMediaItems,
  mockThemeService,
  mockLanguageService,
  mockCreateSignal,
  mockOnCleanup,
  mockCreateComponent,
  mockRender,
  mockLazy,
  mockSuspense,
} = vi.hoisted(() => {
  const mockSetError = vi.fn();
  const mockCloseGallery = vi.fn();
  const mockOpenGallery = vi.fn();
  const mockNavigateNext = vi.fn();
  const mockNavigatePrevious = vi.fn();

  const mockIsOpen = {
    value: false,
    subscribe: vi.fn(cb => {
      cb(false);
      return vi.fn();
    }),
  };

  const mockMediaItems = {
    value: [] as unknown[],
  };

  const mockThemeService = {
    getCurrentTheme: vi.fn(() => 'light'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onThemeChange: vi.fn((_cb: any) => vi.fn()),
  };

  const mockLanguageService = {
    getCurrentLanguage: vi.fn(() => 'en'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onLanguageChange: vi.fn((_cb: any) => vi.fn()),
    t: vi.fn(k => k),
  };

  const mockCreateSignal = vi.fn(initial => [() => initial, vi.fn()]);
  const mockOnCleanup = vi.fn();
  const mockCreateComponent = vi.fn((comp, props) => {
    if (typeof comp === 'function') {
      return comp(props);
    }
    return document.createElement('div');
  });
  const mockRender = vi.fn((fn, _el) => {
    fn();
    return vi.fn();
  });
  const mockLazy = vi.fn(fn => fn);
  const mockSuspense = vi.fn(props => props.children);

  return {
    mockSetError,
    mockCloseGallery,
    mockOpenGallery,
    mockNavigateNext,
    mockNavigatePrevious,
    mockIsOpen,
    mockMediaItems,
    mockThemeService,
    mockLanguageService,
    mockCreateSignal,
    mockOnCleanup,
    mockCreateComponent,
    mockRender,
    mockLazy,
    mockSuspense,
  };
});

vi.mock('@shared/state/signals/gallery.signals', () => ({
  gallerySignals: {
    isOpen: mockIsOpen,
    mediaItems: mockMediaItems,
    currentIndex: { value: 0 },
  },
  closeGallery: mockCloseGallery,
  setError: mockSetError,
  openGallery: mockOpenGallery,
  navigateNext: mockNavigateNext,
  navigatePrevious: mockNavigatePrevious,
}));

vi.mock('@shared/state/signals/download.signals', () => ({
  acquireDownloadLock: vi.fn(),
  isDownloadLocked: vi.fn(),
}));

vi.mock('@shared/container/service-accessors', () => ({
  getThemeService: () => mockThemeService,
  getLanguageService: () => mockLanguageService,
}));

vi.mock('@shared/services/download/download-orchestrator', () => ({
  DownloadOrchestrator: {
    getInstance: vi.fn(() => ({})),
  },
}));

vi.mock('@shared/services/notification-service', () => ({
  NotificationService: {
    getInstance: vi.fn(() => ({})),
  },
}));

vi.mock('@shared/external/userscript', () => ({
  isGMAPIAvailable: vi.fn(() => true),
}));

vi.mock('@shared/components/isolation', () => ({
  GalleryContainer: (props: any) => {
    if (typeof props.children === 'function') {
      props.children();
    }
    return document.createElement('div');
  },
}));

vi.mock('@shared/components/ui/ErrorBoundary/ErrorBoundary', () => ({
  ErrorBoundary: (props: any) => {
    if (typeof props.children === 'function') {
      props.children();
    }
    return document.createElement('div');
  },
}));

vi.mock('./components/vertical-gallery-view/VerticalGalleryView', () => ({
  VerticalGalleryView: () => document.createElement('div'),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@shared/external/vendors/solid-hooks', () => ({
  createSignal: mockCreateSignal,
  onCleanup: mockOnCleanup,
  createComponent: mockCreateComponent,
  render: mockRender,
  lazy: mockLazy,
  Suspense: mockSuspense,
}));

describe('GalleryRenderer Mutation Tests', () => {
  let renderer: GalleryRenderer;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    mockIsOpen.value = false;
    mockMediaItems.value = [];

    // Reset subscription mock
    let subscriber: ((val: boolean) => void) | null = null;
    mockIsOpen.subscribe.mockImplementation(cb => {
      subscriber = cb;
      cb(mockIsOpen.value);
      return vi.fn();
    });

    // Helper to trigger subscription
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockIsOpen as any).set = (val: boolean) => {
      mockIsOpen.value = val;
      if (subscriber) subscriber(val);
    };

    renderer = new GalleryRenderer();
  });

  afterEach(() => {
    // Cleanup if needed
  });

  it('should handle error during rendering', () => {
    // Arrange
    const error = new Error('Render failed');
    mockRender.mockImplementationOnce(() => {
      throw error;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockMediaItems.value = [{ id: '1' } as any];

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockIsOpen as any).set(true);

    // Assert
    expect(logger.error).toHaveBeenCalledWith('[GalleryRenderer] Rendering failed:', error);
    expect(mockSetError).toHaveBeenCalledWith('Gallery rendering failed');
  });

  it('should setup theme and language subscriptions in Root component', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockMediaItems.value = [{ id: '1' } as any];
    const mockSetTheme = vi.fn();
    const mockSetLang = vi.fn();

    mockCreateSignal
      .mockReturnValueOnce([() => 'light', mockSetTheme]) // Theme
      .mockReturnValueOnce([() => 'en', mockSetLang]); // Language

    let themeCallback: (name: string, setting: string) => void = () => {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockThemeService.onThemeChange.mockImplementation((cb: any) => {
      themeCallback = cb;
      return vi.fn();
    });

    let langCallback: (lang: string) => void = () => {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockLanguageService.onLanguageChange.mockImplementation((cb: any) => {
      langCallback = cb;
      return vi.fn();
    });

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockIsOpen as any).set(true);

    // Assert
    expect(mockThemeService.onThemeChange).toHaveBeenCalled();
    expect(mockLanguageService.onLanguageChange).toHaveBeenCalled();

    // Trigger callbacks
    themeCallback('theme', 'dark');
    expect(mockSetTheme).toHaveBeenCalledWith('dark');

    langCallback('ko');
    expect(mockSetLang).toHaveBeenCalledWith('ko');
  });

  it('should cleanup subscriptions on unmount', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockMediaItems.value = [{ id: '1' } as any];
    const mockUnbindTheme = vi.fn();
    const mockUnbindLang = vi.fn();

    mockThemeService.onThemeChange.mockReturnValue(mockUnbindTheme);
    mockLanguageService.onLanguageChange.mockReturnValue(mockUnbindLang);

    let cleanupCallback: () => void = () => {};
    mockOnCleanup.mockImplementation(cb => {
      cleanupCallback = cb;
    });

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockIsOpen as any).set(true);

    // Assert
    expect(mockOnCleanup).toHaveBeenCalled();

    // Trigger cleanup
    cleanupCallback();
    expect(mockUnbindTheme).toHaveBeenCalled();
    expect(mockUnbindLang).toHaveBeenCalled();
  });

  it('should warn when cleanupContainer throws during render teardown', () => {
    const internal = renderer as unknown as {
      cleanupContainer: () => void;
      container: HTMLDivElement | null;
      disposeApp: (() => void) | null;
    };

    const node = document.createElement('div');
    document.body.appendChild(node);
    internal.container = node;
    internal.disposeApp = () => {
      throw new Error('cleanup failure');
    };

    expect(() => internal.cleanupContainer()).not.toThrow();
    expect(logger.warn).toHaveBeenCalledWith(
      '[GalleryRenderer] Container cleanup failed:',
      expect.any(Error)
    );
    expect(internal.container).toBeNull();
  });
});
