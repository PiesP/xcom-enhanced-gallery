import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { h } from 'preact';
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

// Minimal reproduction for Toolbar test execution hang

describe('toolbar minimal render (diagnostic RED)', () => {
  it('renders toolbar without interaction', () => {
    const { getByRole } = render(
      h(Toolbar, {
        currentIndex: 0,
        totalCount: 1,
        onPrevious: () => {},
        onNext: () => {},
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
        onClose: () => {},
      })
    );
    const toolbar = getByRole('toolbar');
    expect(toolbar).toBeTruthy();
  });
});
