import { describe, it, expect, vi } from 'vitest';

vi.resetModules();

// Ensure modules used by the component are mocked before import
// Provide a minimal settings-access mock so getSetting/setSetting don't throw
vi.doMock('@shared/container/settings-access', () => ({
  getSetting: (_key: any, fallback: any) => fallback,
  setSetting: vi.fn().mockResolvedValue(undefined),
}));
vi.doMock('@shared/logging', () => ({ logger: { debug: vi.fn(), warn: vi.fn() } }));

// Provide a galleryState with items
vi.doMock('@shared/state/signals/gallery.signals', () => ({ galleryState: { value: { mediaItems: [{ id: '1', url: 'url1', type: 'image' }], currentIndex: 0 } }, navigateToItem: vi.fn(), }));
vi.doMock('@shared/state/signals/download.signals', () => ({ downloadState: { value: { isProcessing: false } }, __test__: { setDownloadState: vi.fn() } }));

// Mock focus tracker to return null for forceSync (so focusSyncCallback() returns null)
vi.doMock('@features/gallery/hooks/useGalleryFocusTracker', () => ({ useGalleryFocusTracker: () => ({ focusedIndex: () => 0, registerItem: vi.fn(), handleItemFocus: vi.fn(), forceSync: null }) }));

// Capture onScrollEnd from useGalleryScroll
let capturedOnScrollEnd: (() => void) | undefined = undefined;
vi.doMock('@features/gallery/hooks/useGalleryScroll', () => ({ useGalleryScroll: (cfg: any) => { capturedOnScrollEnd = cfg.onScrollEnd; return { isScrolling: () => false }; } }));

// Mock other dependencies
vi.doMock('@features/gallery/hooks/useGalleryItemScroll', () => ({ useGalleryItemScroll: () => ({ scrollToItem: vi.fn(), scrollToCurrentItem: vi.fn() }) }));
vi.doMock('@features/gallery/components/vertical-gallery-view/hooks/useGalleryNavigation', () => ({ useGalleryNavigation: () => ({ lastNavigationTrigger: () => null, programmaticScrollTimestamp: () => 0, setProgrammaticScrollTimestamp: vi.fn() }) }));
vi.doMock('@features/gallery/components/vertical-gallery-view/hooks/useToolbarAutoHide', () => ({ useToolbarAutoHide: () => ({ isInitialToolbarVisible: () => true, setIsInitialToolbarVisible: vi.fn() }) }));
vi.doMock('@shared/components/ui/Toolbar/Toolbar', () => ({ Toolbar: (_props: any) => <div data-testid="toolbar">Toolbar</div> }));
vi.doMock('@features/gallery/components/vertical-gallery-view/VerticalImageItem', () => ({ VerticalImageItem: (props: any) => <div data-testid={`gallery-item-${props.index}`}>Item</div> }));

const { render } = await import('@solidjs/testing-library');
const { VerticalGalleryView } = await import('@features/gallery/components/vertical-gallery-view/VerticalGalleryView');

describe('VerticalGalleryView focusSyncCallback optional chaining', () => {
  it('should NOT throw when focusSyncCallback returns null and onScrollEnd is invoked', () => {
    render(() => <VerticalGalleryView />);
    // Ensure capturedOnScrollEnd is set
    expect(typeof capturedOnScrollEnd).toBe('function');
    expect(() => capturedOnScrollEnd?.()).not.toThrow();
  });
});
