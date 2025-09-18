import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { h } from 'preact';
// Mocks to prevent full vendor & hook initialization hang
vi.mock('@shared/external/vendors', () => ({
  getPreact: () => ({ h }),
  getPreactHooks: () => ({
    useMemo: (fn: any) => fn(),
    useCallback: (fn: any) => fn,
    useEffect: () => void 0,
    useRef: (init?: any) => ({ current: init ?? null }),
  }),
  getPreactCompat: () => ({ memo: (C: any) => C }),
  initializeVendors: vi.fn(() => Promise.resolve()),
  isVendorsInitialized: vi.fn(() => true),
}));
vi.mock('@shared/hooks/useToolbarState', () => ({
  useToolbarState: () => [
    {
      isDownloading: false,
      isLoading: false,
      hasError: false,
      currentFitMode: 'original',
      needsHighContrast: false,
    },
    {
      setDownloading: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setCurrentFitMode: vi.fn(),
      setNeedsHighContrast: vi.fn(),
      resetState: vi.fn(),
    },
  ],
  getToolbarDataState: () => 'idle',
  getToolbarClassName: () => 'toolbar',
}));
vi.mock('@shared/utils', () => ({ throttleScroll: (fn: any) => fn }));
import { Toolbar } from '@/shared/components/ui/Toolbar/Toolbar';

// P5 RED: Keyboard navigation (Arrow/Home/End/Escape) contract for Toolbar
// Focus order (enabled buttons only): prev -> next -> fit-original -> fit-width -> fit-height -> fit-container -> download-current -> download-all -> settings -> close

describe('toolbar keyboard navigation (P5 RED)', () => {
  function setup() {
    // Directly use h from preact
    const calls = { prev: 0, next: 0, close: 0, settings: 0 };
    const utils = render(
      h(Toolbar, {
        currentIndex: 1, // prev & next both enabled
        totalCount: 5,
        isDownloading: false,
        onPrevious: () => calls.prev++,
        onNext: () => calls.next++,
        onDownloadCurrent: () => void 0,
        onDownloadAll: () => void 0,
        onClose: () => calls.close++,
        onOpenSettings: () => calls.settings++,
        onFitOriginal: () => void 0,
        onFitWidth: () => void 0,
        onFitHeight: () => void 0,
        onFitContainer: () => void 0,
        'data-testid': 'toolbar',
      })
    );
    const toolbar = utils.getByRole('toolbar');
    return { ...utils, toolbar, calls };
  }

  it('navigates with Home/End/Arrow keys and handles Escape (RED spec)', () => {
    const { toolbar, calls } = setup();

    (toolbar as any).focus();
    expect(globalThis.document?.activeElement).toBe(toolbar as unknown);

    fireEvent.keyDown(toolbar, { key: 'Home' });
    const prev = toolbar.querySelector('[data-gallery-element="nav-previous"]');

    expect(globalThis.document?.activeElement).toBe(prev as unknown);

    fireEvent.keyDown(prev, { key: 'ArrowRight' });
    const next = toolbar.querySelector('[data-gallery-element="nav-next"]');

    expect(globalThis.document?.activeElement).toBe(next as unknown);

    fireEvent.keyDown(next, { key: 'End' });
    const close = toolbar.querySelector('[data-gallery-element="close"]');

    expect(globalThis.document?.activeElement).toBe(close as unknown);

    fireEvent.keyDown(close, { key: 'ArrowLeft' });
    const settings = toolbar.querySelector('[data-gallery-element="settings"]');

    expect(globalThis.document?.activeElement).toBe(settings as unknown);

    fireEvent.keyDown(settings, { key: 'Escape' });
    expect(calls.close).toBe(1);
  });
});
