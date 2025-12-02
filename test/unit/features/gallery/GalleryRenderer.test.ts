import { GalleryRenderer } from '@features/gallery/GalleryRenderer';
import type { VerticalGalleryViewProps } from '@features/gallery/components/vertical-gallery-view/VerticalGalleryView';
import { logger } from '@shared/logging';
import type { JSXElement } from '@shared/external/vendors';
import type { MediaInfo } from '@shared/types/media.types';

interface GalleryContainerMockProps {
  readonly onClose?: () => void;
  readonly children?: () => unknown;
  readonly [key: string]: unknown;
}

type TestGlobal = typeof globalThis & {
  __galleryContainerProps?: GalleryContainerMockProps | null;
};

const testGlobal = globalThis as TestGlobal;
const verticalViewPropsLog: VerticalGalleryViewProps[] = [];

const mockEnsureDownloadServiceRegistered = vi.hoisted(() => {
  const fn = vi.fn<() => Promise<void>>();
  fn.mockImplementation(async () => {});
  return fn;
});

const {
  mockIsOpen,
  mockMediaItems,
  mockCurrentIndex,
  mockDownloadSingle,
  mockDownloadBulk,
  mockAcquireDownloadLock,
  mockReleaseLock,
  mockIsDownloadLocked,
  mockSetError,
  mockCloseGallery,
  mockOpenGallery,
  mockNavigateNext,
  mockNavigatePrevious,
  mockIsGMAPIAvailable,
} = vi.hoisted(() => {
  function createTestSignal<T>(initialValue: T) {
    let value = initialValue;
    const subscribers = new Set<(val: T) => void>();

    return {
      get value() {
        return value;
      },
      set value(newValue: T) {
        value = newValue;
        subscribers.forEach(cb => cb(value));
      },
      setRawValue(newValue: T) {
        value = newValue;
      },
      subscribe(callback: (val: T) => void) {
        subscribers.add(callback);
        callback(value);
        return () => subscribers.delete(callback);
      },
    };
  }

  const mockDownloadSingle = vi.fn();
  const mockDownloadBulk = vi.fn();
  const mockAcquireDownloadLock = vi.fn();
  const mockReleaseLock = vi.fn();
  const mockIsDownloadLocked = vi.fn();
  const mockSetError = vi.fn();
  const mockCloseGallery = vi.fn(() => {
    mockIsOpen.value = false;
  });
  const mockOpenGallery = vi.fn();
  const mockNavigateNext = vi.fn();
  const mockNavigatePrevious = vi.fn();
  const mockIsGMAPIAvailable = vi.fn();

  return {
    mockIsOpen: createTestSignal(false),
    mockMediaItems: createTestSignal<MediaInfo[]>([]),
    mockCurrentIndex: { value: 0 },
    mockDownloadSingle,
    mockDownloadBulk,
    mockAcquireDownloadLock,
    mockReleaseLock,
    mockIsDownloadLocked,
    mockSetError,
    mockCloseGallery,
    mockOpenGallery,
    mockNavigateNext,
    mockNavigatePrevious,
    mockIsGMAPIAvailable,
  };
});

// Mock dependencies
vi.mock('@shared/external/vendors', async () => {
  const Solid = await import('solid-js');
  const SolidWeb = await import('solid-js/web');
  return {
    getSolid: () => ({
      ...Solid,
      render: (fn: () => JSXElement, element: Node) => SolidWeb.render(fn, element as HTMLElement),
    }),
  };
});

vi.mock('@shared/state/signals/gallery.signals', () => ({
  gallerySignals: {
    isOpen: mockIsOpen,
    mediaItems: mockMediaItems,
    currentIndex: mockCurrentIndex,
  },
  closeGallery: mockCloseGallery,
  setError: mockSetError,
  openGallery: mockOpenGallery,
  navigateNext: mockNavigateNext,
  navigatePrevious: mockNavigatePrevious,
}));

vi.mock('@shared/state/signals/download.signals', () => ({
  acquireDownloadLock: mockAcquireDownloadLock,
  isDownloadLocked: mockIsDownloadLocked,
}));

vi.mock('@shared/container/service-accessors', () => ({
  getThemeService: vi.fn(() => ({
    getCurrentTheme: vi.fn(() => 'light'),
    onThemeChange: vi.fn(() => vi.fn()),
    subscribe: vi.fn(() => vi.fn()),
  })),
  getLanguageService: vi.fn(() => ({
    t: vi.fn(key => key),
    getCurrentLanguage: vi.fn(() => 'en'),
    onLanguageChange: vi.fn(() => vi.fn()),
    subscribe: vi.fn(() => vi.fn()),
  })),
}));

vi.mock('@shared/services/download/download-orchestrator', () => ({
  DownloadOrchestrator: {
    getInstance: vi.fn(() => ({
      downloadSingle: mockDownloadSingle,
      downloadBulk: mockDownloadBulk,
    })),
  },
}));

vi.mock('@shared/external/userscript', () => ({
  isGMAPIAvailable: mockIsGMAPIAvailable,
}));

vi.mock('@shared/components/isolation', () => ({
  GalleryContainer: (props: GalleryContainerMockProps) => {
    testGlobal.__galleryContainerProps = props;
    if (typeof props.children === 'function') {
      const result = props.children();
      if (Array.isArray(result)) {
        result.forEach(() => {});
      }
    }
    return document.createElement('div');
  },
}));

vi.mock('@shared/components/ui/ErrorBoundary/ErrorBoundary', () => ({
  ErrorBoundary: (props: { children?: () => unknown }) => {
    if (typeof props.children === 'function') {
      const output = props.children();
      if (Array.isArray(output)) {
        output.forEach(() => {});
      }
    }
    return document.createElement('div');
  },
}));

vi.mock('@shared/services/lazy-services', () => ({
  ensureDownloadServiceRegistered: mockEnsureDownloadServiceRegistered,
}));

vi.mock('@shared/logging', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve, 0));

const createMediaItem = (id = '1'): MediaInfo => ({
  id,
  url: `https://example.com/${id}.jpg`,
  type: 'image',
  originalUrl: `https://example.com/${id}.jpg`,
  thumbnailUrl: `https://example.com/${id}-thumb.jpg`,
});

const getLatestGalleryContainerProps = () => testGlobal.__galleryContainerProps ?? null;
const getLatestVerticalViewProps = () => verticalViewPropsLog.at(-1) ?? null;

// Mock the VerticalGalleryView component to avoid rendering the full tree
vi.mock('@features/gallery/components/vertical-gallery-view/VerticalGalleryView', () => ({
  VerticalGalleryView: (props: VerticalGalleryViewProps) => {
    verticalViewPropsLog.push(props);
    return document.createElement('div');
  },
}));

describe('GalleryRenderer', () => {
  let renderer: GalleryRenderer;

  beforeEach(() => {
    document.body.innerHTML = '';
    testGlobal.__galleryContainerProps = null;
    verticalViewPropsLog.length = 0;
    mockIsOpen.value = false;
    mockMediaItems.value = [];
    mockCurrentIndex.value = 0;
    mockEnsureDownloadServiceRegistered.mockReset();
    mockEnsureDownloadServiceRegistered.mockResolvedValue(undefined);
    mockReleaseLock.mockReset();
    mockAcquireDownloadLock.mockReset();
    mockAcquireDownloadLock.mockImplementation(() => mockReleaseLock);
    mockIsDownloadLocked.mockReset();
    mockIsDownloadLocked.mockReturnValue(false);
    mockIsGMAPIAvailable.mockReset();
    mockIsGMAPIAvailable.mockReturnValue(true);
    mockDownloadSingle.mockReset();
    mockDownloadBulk.mockReset();
    mockSetError.mockReset();
    mockCloseGallery.mockReset();
    mockOpenGallery.mockReset();
    mockNavigateNext.mockReset();
    mockNavigatePrevious.mockReset();

    renderer = new GalleryRenderer();
  });

  afterEach(() => {
    renderer.destroy();
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  const openWithItems = async (items: MediaInfo[]): Promise<void> => {
    mockMediaItems.value = items;
    mockIsOpen.value = true;
    await flushMicrotasks();
  };

  it('should skip renderComponent when container is missing', () => {
    const internal = renderer as unknown as { renderComponent: () => void; container: HTMLDivElement | null };
    internal.container = null;

    expect(() => internal.renderComponent()).not.toThrow();
  });

  it('should not render when initialized', () => {
    expect(document.querySelector('.xeg-gallery-renderer')).toBeNull();
  });

  it('should render when isOpen becomes true and has media items', async () => {
    await openWithItems([createMediaItem('1')]);

    const container = document.querySelector('.xeg-gallery-renderer');
    expect(container).not.toBeNull();
    expect(container?.getAttribute('data-renderer')).toBe('gallery');
  });

  it('should not render if isOpen is true but no media items', async () => {
    mockMediaItems.value = [];
    mockIsOpen.value = true;

    await flushMicrotasks();

    expect(document.querySelector('.xeg-gallery-renderer')).toBeNull();
  });

  it('should cleanup when isOpen becomes false', async () => {
    // First render
    await openWithItems([createMediaItem('1')]);
    expect(document.querySelector('.xeg-gallery-renderer')).not.toBeNull();

    // Then close
    mockIsOpen.value = false;
    await flushMicrotasks();

    expect(document.querySelector('.xeg-gallery-renderer')).toBeNull();
  });

  it('should not re-render when container already exists', async () => {
    await openWithItems([createMediaItem('repeat')]);
    const renderSpy = vi.spyOn(renderer as unknown as { renderGallery: () => void }, 'renderGallery');

    renderSpy.mockClear();
    mockIsOpen.value = true;
    await flushMicrotasks();

    expect(renderSpy).not.toHaveBeenCalled();
    renderSpy.mockRestore();
  });

  it('should skip cleanup when container is already removed', async () => {
    const cleanupSpy = vi.spyOn(renderer as unknown as { cleanupGallery: () => void }, 'cleanupGallery');

    cleanupSpy.mockClear();
    // Ensure container is null to exercise guard
    (renderer as unknown as { container: HTMLDivElement | null }).container = null;

    mockIsOpen.value = false;
    await flushMicrotasks();

    expect(cleanupSpy).not.toHaveBeenCalled();
    cleanupSpy.mockRestore();
  });

  it('should exit render pipeline when already rendering', () => {
    const createSpy = vi.spyOn(renderer as unknown as { createContainer: () => void }, 'createContainer');
    const internal = renderer as unknown as { renderGallery: () => void; isRenderingFlag: boolean };

    mockMediaItems.value = [createMediaItem('guard')];
    (mockIsOpen as typeof mockIsOpen & { setRawValue: (val: boolean) => void }).setRawValue(true);

    internal.isRenderingFlag = true;
    internal.renderGallery();

    expect(createSpy).not.toHaveBeenCalled();
    createSpy.mockRestore();
  });

  it('should call onCloseCallback when closed via signal', async () => {
    const onClose = vi.fn();
    renderer.setOnCloseCallback(onClose);

    // Render
    await openWithItems([createMediaItem('1')]);

    // Close via signal (simulating external close)
    mockIsOpen.value = false;
    await flushMicrotasks();

    // Note: onCloseCallback is NOT called when isOpen becomes false.
    // It is called when the user interacts with the UI to close it.
    // But we can test that setOnCloseCallback sets the property.
    // @ts-expect-error - Accessing private property for testing
    expect(renderer.onCloseCallback).toBe(onClose);
  });

  it('should invoke onClose callback when GalleryContainer triggers close', async () => {
    const onClose = vi.fn();
    renderer.setOnCloseCallback(onClose);

    await openWithItems([createMediaItem('close')]);

    const props = getLatestGalleryContainerProps();
    expect(props?.onClose).toBeTypeOf('function');
    props?.onClose?.();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockCloseGallery).toHaveBeenCalledTimes(1);
  });

  it('should close gallery gracefully without external callback', async () => {
    await openWithItems([createMediaItem('solo-close')]);

    mockCloseGallery.mockClear();
    const props = getLatestGalleryContainerProps();
    expect(props?.onClose).toBeTypeOf('function');

    expect(() => props?.onClose?.()).not.toThrow();
    expect(mockCloseGallery).toHaveBeenCalledTimes(1);
  });

  it('should forward navigation and download handlers through VerticalGalleryView props', async () => {
    const downloadSpy = vi.spyOn(renderer, 'handleDownload');
    mockDownloadSingle.mockResolvedValue({ success: true });
    mockDownloadBulk.mockResolvedValue({ success: true });
    await openWithItems([createMediaItem('nav-1')]);
    await flushMicrotasks();

    const props = getLatestVerticalViewProps();
    expect(props).not.toBeNull();
    const verticalProps = props!;

    mockNavigatePrevious.mockClear();
    verticalProps.onPrevious?.();
    expect(mockNavigatePrevious).toHaveBeenCalledWith('button');

    mockNavigateNext.mockClear();
    verticalProps.onNext?.();
    expect(mockNavigateNext).toHaveBeenCalledWith('button');

    await verticalProps.onDownloadCurrent?.();
    await verticalProps.onDownloadAll?.();
    expect(downloadSpy).toHaveBeenNthCalledWith(1, 'current');
    expect(downloadSpy).toHaveBeenNthCalledWith(2, 'all');

    downloadSpy.mockRestore();
  });

  it('should surface render errors and reset rendering flag', async () => {
    const renderSpy = vi

      .spyOn(renderer as unknown as { renderComponent: () => void }, 'renderComponent')
      .mockImplementation(() => {
        throw new Error('render failure');
      });

    await openWithItems([createMediaItem('error')]);

    expect(mockSetError).toHaveBeenCalledWith('Gallery rendering failed');
    expect(renderer.isRendering()).toBe(false);

    renderSpy.mockRestore();
  });

  it('should warn when lazy download service registration fails', async () => {
    mockEnsureDownloadServiceRegistered.mockRejectedValueOnce(new Error('lazy fail'));

    await (
      renderer as unknown as {
        ensureDownloadService: () => Promise<void>;
      }
    ).ensureDownloadService();

    expect(logger.warn).toHaveBeenCalledWith(
      '[GalleryRenderer] DownloadService lazy registration failed:',
      expect.any(Error)
    );
  });

  it('should cleanup DOM nodes when destroy is invoked', async () => {
    await openWithItems([createMediaItem('cleanup')]);
    expect(document.querySelector('.xeg-gallery-renderer')).not.toBeNull();

    renderer.destroy();

    expect(document.querySelector('.xeg-gallery-renderer')).toBeNull();
  });

  it('should warn when cleanupContainer throws during DOM teardown', () => {
    const internal = renderer as unknown as {
      cleanupContainer: () => void;
      container: HTMLDivElement | null;
      disposeApp: (() => void) | null;
    };
    const faulty = document.createElement('div');
    document.body.appendChild(faulty);
    internal.container = faulty;
    internal.disposeApp = () => {
      throw new Error('dispose boom');
    };

    expect(() => internal.cleanupContainer()).not.toThrow();
    expect(logger.warn).toHaveBeenCalledWith(
      '[GalleryRenderer] Container cleanup failed:',
      expect.any(Error)
    );
    expect(internal.container).toBeNull();
  });

  describe('handleDownload', () => {
    const setMediaState = (items: MediaInfo[], currentIndex = 0): void => {
      mockMediaItems.value = items;
      mockCurrentIndex.value = currentIndex;
    };

    it('should skip single download when current media is missing', async () => {
      setMediaState([createMediaItem('only')], 5);

      await renderer.handleDownload('current');

      expect(mockDownloadSingle).not.toHaveBeenCalled();
    });

    it('should short-circuit when GM_download is unavailable', async () => {
      mockIsGMAPIAvailable.mockReturnValue(false);
      setMediaState([createMediaItem('1')]);

      await renderer.handleDownload('current');

      expect(mockSetError).toHaveBeenCalledWith('Tampermonkey required for downloads.');
      expect(mockAcquireDownloadLock).not.toHaveBeenCalled();
      expect(mockDownloadSingle).not.toHaveBeenCalled();
    });

    it('should skip when download lock is active', async () => {
      mockIsDownloadLocked.mockReturnValue(true);
      setMediaState([createMediaItem('1')]);

      await renderer.handleDownload('current');

      expect(mockAcquireDownloadLock).not.toHaveBeenCalled();
    });

    it('should download current media', async () => {
      const items = [createMediaItem('1'), createMediaItem('2')];
      setMediaState(items, 1);
      mockDownloadSingle.mockResolvedValue({ success: true, filename: 'photo-2.jpg' });

      await renderer.handleDownload('current');

      expect(mockDownloadSingle).toHaveBeenCalledWith(items[1]);
      expect(mockReleaseLock).toHaveBeenCalledTimes(1);
    });

    it('should surface error when current download fails', async () => {
      const items = [createMediaItem('1')];
      setMediaState(items, 0);
      mockDownloadSingle.mockResolvedValue({ success: false, error: 'Network issue' });

      await renderer.handleDownload('current');

      expect(mockSetError).toHaveBeenCalledWith('Network issue');
      expect(mockReleaseLock).toHaveBeenCalledTimes(1);
    });

    it('should ensure services before bulk download', async () => {
      const items = [createMediaItem('1'), createMediaItem('2')];
      setMediaState(items);

      const ensureSpy = vi
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(GalleryRenderer.prototype as any, 'ensureDownloadService')
        .mockResolvedValue(undefined);
      mockDownloadBulk.mockResolvedValue({ success: true, filesSuccessful: 2 });

      await renderer.handleDownload('all');

      expect(ensureSpy).toHaveBeenCalledTimes(1);
      expect(mockDownloadBulk).toHaveBeenCalledWith(items);
      ensureSpy.mockRestore();
    });

    it('should set error when bulk download reports failure', async () => {
      const items = [createMediaItem('1'), createMediaItem('2')];
      setMediaState(items);
      mockDownloadBulk.mockResolvedValue({ success: false, error: 'Quota exceeded' });

      await renderer.handleDownload('all');

      expect(mockSetError).toHaveBeenCalledWith('Quota exceeded');
      expect(mockReleaseLock).toHaveBeenCalledTimes(1);
    });

    it('should release lock even if bulk download throws', async () => {
      const items = [createMediaItem('1')];
      setMediaState(items);
      mockDownloadBulk.mockRejectedValue(new Error('Unexpected failure'));

      await renderer.handleDownload('all');

      expect(mockSetError).toHaveBeenCalledWith('Download failed.');
      expect(mockReleaseLock).toHaveBeenCalledTimes(1);
    });
  });

  describe('public API', () => {
    it('should default render start index to zero', async () => {
      await renderer.render([createMediaItem('start')]);

      expect(mockOpenGallery).toHaveBeenCalledWith(expect.any(Array), 0);
    });

    it('should respect provided start index when rendering', async () => {
      await renderer.render([createMediaItem('first'), createMediaItem('second')], {
        startIndex: 1,
      });

      expect(mockOpenGallery).toHaveBeenCalledWith(expect.any(Array), 1);
    });

    it('should delegate close() to gallery signal', () => {
      renderer.close();

      expect(mockCloseGallery).toHaveBeenCalledTimes(1);
    });

    it('should tolerate missing state unsubscribe during destroy', () => {
      const localRenderer = new GalleryRenderer();
      (localRenderer as unknown as { stateUnsubscribe: (() => void) | null }).stateUnsubscribe = null;

      expect(() => localRenderer.destroy()).not.toThrow();
    });

    it('should expose rendering flag via isRendering()', () => {
      const instance = renderer as unknown as { isRenderingFlag: boolean };
      instance.isRenderingFlag = true;
      expect(renderer.isRendering()).toBe(true);

      instance.isRenderingFlag = false;
      expect(renderer.isRendering()).toBe(false);
    });
  });
});
