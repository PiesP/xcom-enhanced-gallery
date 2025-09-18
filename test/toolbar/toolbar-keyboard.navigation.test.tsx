import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { h } from 'preact';
// Vendor & hook mocks to isolate keyboard navigation behavior without full environment side-effects
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

// GREEN: Keyboard navigation (Arrow/Home/End/Escape) contract for Toolbar
// Focus order (enabled buttons only): prev -> next -> fit-original -> fit-width -> fit-height -> fit-container -> download-current -> download-all -> settings -> close

describe('toolbar keyboard navigation (P5 GREEN)', () => {
  function setup() {
    const calls = { close: 0 };
    const utils = render(
      h(Toolbar, {
        currentIndex: 1, // prev & next enabled
        totalCount: 5,
        isDownloading: false,
        onPrevious: () => void 0,
        onNext: () => void 0,
        onDownloadCurrent: () => void 0,
        onDownloadAll: () => void 0,
        onClose: () => calls.close++,
        onOpenSettings: () => void 0,
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

  it('supports Home/End/Arrow and Escape focus/close behavior', () => {
    const { toolbar, calls } = setup();
    (toolbar as any).focus();
    expect((globalThis as any).document.activeElement).toBe(toolbar as any);

    // Home -> first
    fireEvent.keyDown(toolbar, { key: 'Home' });
    const prev = toolbar.querySelector('[data-gallery-element="nav-previous"]');
    expect((globalThis as any).document.activeElement).toBe(prev as any);

    // ArrowRight -> next
    fireEvent.keyDown(prev as any, { key: 'ArrowRight' });
    const next = toolbar.querySelector('[data-gallery-element="nav-next"]');
    expect((globalThis as any).document.activeElement).toBe(next as any);

    // End -> close
    fireEvent.keyDown(next as any, { key: 'End' });
    const close = toolbar.querySelector('[data-gallery-element="close"]');
    expect((globalThis as any).document.activeElement).toBe(close as any);

    // ArrowLeft from close -> settings
    fireEvent.keyDown(close as any, { key: 'ArrowLeft' });
    const settings = toolbar.querySelector('[data-gallery-element="settings"]');
    expect((globalThis as any).document.activeElement).toBe(settings as any);

    // Escape triggers onClose (without changing focus requirement)
    fireEvent.keyDown(settings as any, { key: 'Escape' });
    expect(calls.close).toBe(1);
  });
});
