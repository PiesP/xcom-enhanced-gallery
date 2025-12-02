import { describe, it, expect, vi, beforeEach } from 'vitest';

// Reset module cache to allow dynamic mocking
vi.resetModules();

// Ensure settings-access is mocked early to prevent requiring SettingsService
vi.doMock('@shared/container/settings-access', () => ({ getSetting: (_key: any, fallback: any) => fallback, setSetting: vi.fn().mockResolvedValue(undefined) }));

// Mock the useSelector to capture calls
const capturedCalls: any[] = [];
vi.doMock('@shared/state/signals/signal-selector', () => ({
  useSelector: (signal: any, selector: any, options?: any) => {
    capturedCalls.push({ signal, selector, options });
    // Return a simple accessor that returns the selected value
    return () => selector(signal.value);
  },
  __test__: { getCapturedCalls: () => capturedCalls },
}));

// Mock gallery signals and download state
vi.doMock('@shared/state/signals/gallery.signals', () => ({
  galleryState: { value: { mediaItems: ['m1', 'm2', 'm3'], currentIndex: 1 } },
  navigateToItem: vi.fn(),
}));

vi.doMock('@shared/state/signals/download.signals', () => ({
  downloadState: { value: { isProcessing: true } },
  __test__: { setDownloadState: vi.fn() },
}));

// Mock other dependencies used by the component to render safely
vi.doMock('@features/gallery/hooks/useGalleryItemScroll', () => ({ useGalleryItemScroll: () => ({ scrollToItem: vi.fn(), scrollToCurrentItem: vi.fn() }) }));
vi.doMock('@features/gallery/hooks/useGalleryScroll', () => ({ useGalleryScroll: () => ({ isScrolling: () => false }) }));
vi.doMock('@features/gallery/components/vertical-gallery-view/hooks/useToolbarAutoHide', () => ({ useToolbarAutoHide: () => ({ isInitialToolbarVisible: () => true, setIsInitialToolbarVisible: vi.fn() }) }));
vi.doMock('@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard', () => ({ useGalleryKeyboard: () => {} }));
vi.doMock('@features/gallery/components/vertical-gallery-view/hooks/useGalleryNavigation', () => ({ useGalleryNavigation: () => ({ lastNavigationTrigger: () => null, programmaticScrollTimestamp: () => 0, setProgrammaticScrollTimestamp: vi.fn() }) }));
vi.doMock('@features/gallery/components/vertical-gallery-view/hooks/useGalleryFocusTracker', () => ({ useGalleryFocusTracker: () => ({ focusedIndex: () => 0, registerItem: vi.fn(), handleItemFocus: vi.fn(), forceSync: vi.fn() }) }));
vi.doMock('@features/gallery/components/vertical-gallery-view/hooks/useGalleryLifecycle', () => ({ useGalleryLifecycle: () => {} }));
vi.doMock('@shared/components/ui/Toolbar/Toolbar', () => ({ Toolbar: (_props: any) => <div data-testid="toolbar">Toolbar</div> }));
vi.doMock('@features/gallery/components/vertical-gallery-view/VerticalImageItem', () => ({ VerticalImageItem: (props: any) => <div data-testid={`gallery-item-${props.index}`}>Item</div> }));
vi.doMock('@shared/container/settings-access', () => ({ getSetting: (_key: any, fallback: any) => fallback, setSetting: vi.fn().mockResolvedValue(undefined) }));
vi.doMock('@shared/container/service-accessors', () => ({ getLanguageService: () => ({ translate: (v: string) => v }) }));
vi.doMock('@shared/logging', () => ({ logger: { debug: vi.fn(), warn: vi.fn() } }));

const { render } = await import('@solidjs/testing-library');
const { VerticalGalleryView } = await import('@features/gallery/components/vertical-gallery-view/VerticalGalleryView');
const selectorModule = (await import('@shared/state/signals/signal-selector')) as any;

describe('VerticalGalleryView useSelector dependency config', () => {
  beforeEach(() => {
    capturedCalls.length = 0; // clear captured calls
  });

  it('should call useSelector with proper dependency extractor for mediaItems and currentIndex and downloadState', () => {
    render(() => <VerticalGalleryView />);

    // Get the captured calls
    const calls = (selectorModule as any).__test__.getCapturedCalls();

    // Find expected selectors (we look for 3 calls)
    expect(calls.length).toBeGreaterThanOrEqual(3);

    // Find call where selector returns mediaItems
    const mediaCall = calls.find((c: any) => c.selector({ mediaItems: ['m1'] }) && c.selector({ mediaItems: ['m1'] }).length === 1);
    expect(mediaCall).toBeDefined();
    expect(typeof mediaCall.options?.dependencies).toBe('function');
    const mediaDeps = mediaCall.options.dependencies({ mediaItems: ['m1'] });
    expect(Array.isArray(mediaDeps)).toBe(true);
    expect(mediaDeps[0]).toEqual(['m1']);

    // CurrentIndex
    const indexCall = calls.find((c: any) => c.selector({ currentIndex: 2 }) === 2);
    expect(indexCall).toBeDefined();
    expect(typeof indexCall.options?.dependencies).toBe('function');
    const indexDeps = indexCall.options.dependencies({ currentIndex: 2 });
    expect(Array.isArray(indexDeps)).toBe(true);
    expect(indexDeps[0]).toEqual(2);

    // Download state (calls isDownloadUiBusy in selector) - find by presence of options
    const downloadCall = calls.find((c: any) => c.options && c.options.dependencies && typeof c.options.dependencies === 'function' && c.selector({ isProcessing: true }) !== undefined);
    expect(downloadCall).toBeDefined();
    const downloadDeps = downloadCall.options.dependencies({ isProcessing: true });
    expect(Array.isArray(downloadDeps)).toBe(true);
    expect(downloadDeps[0]).toEqual(true);
  });
});
