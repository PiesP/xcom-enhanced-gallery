import { render, screen } from '@testing-library/preact';
import { describe, it, expect } from 'vitest';
import { h } from 'preact';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';

vi.mock('@shared/external/vendors', () => ({
  getFflate: vi.fn(() => ({})),
  getPreact: vi.fn(() => ({ h })),
  getPreactHooks: vi.fn(() => ({
    useMemo: (fn: any) => fn(),
    useCallback: (fn: any) => fn,
    useEffect: () => void 0,
    useRef: (init?: any) => ({ current: init ?? null }),
  })),
  getPreactSignals: vi.fn(() => ({})),
  getPreactCompat: vi.fn(() => ({ memo: (C: any) => C })),
  initializeVendors: vi.fn(() => Promise.resolve()),
  isVendorsInitialized: vi.fn(() => true),
}));

vi.mock('@shared/hooks/useToolbarState', () => ({
  useToolbarState: vi.fn(() => [
    {
      isDownloading: false,
      isLoading: false,
      hasError: false,
      currentFitMode: 'fitWidth',
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
  ]),
  getToolbarDataState: vi.fn(() => 'idle'),
  getToolbarClassName: vi.fn((_s: any, base: string) => base || 'toolbar'),
}));

// Focus order behavioral guard for grouped toolbar (P4)
// Ensures each data-toolbar-group has exactly one element marked data-group-first
// and that element is the first focusable descendant encountered in DOM order.
// We approximate focusability by filtering standard interactive elements.

describe('TBAR-R P4 GREEN: toolbar grouping focus order', () => {
  const mkProps = () => ({
    currentIndex: 0,
    totalCount: 5,
    isDownloading: false,
    disabled: false,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
    onClose: vi.fn(),
    onOpenSettings: vi.fn(),
    onFitOriginal: vi.fn(),
    onFitWidth: vi.fn(),
    onFitHeight: vi.fn(),
    onFitContainer: vi.fn(),
  });

  function setup() {
    render(h(Toolbar as any, mkProps()));
    const toolbar = screen.getByRole('toolbar');
    return { toolbar };
  }

  // Use globalThis.HTMLElement to avoid tsdom lib resolution issues in isolated test compile
  function getFocusable(container: globalThis.HTMLElement): globalThis.HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    return (
      Array.from(container.querySelectorAll<globalThis.HTMLElement>(selector))
        // Filter out elements that are potentially hidden or aria-hidden
        .filter(el => !el.hasAttribute('aria-hidden') && el.tabIndex !== -1)
    );
  }

  it('each group has a single data-group-first which is first focusable', () => {
    const { toolbar } = setup();
    const groups = Array.from(
      toolbar.querySelectorAll('[data-toolbar-group]')
    ) as globalThis.HTMLElement[];
    expect(groups.length).toBeGreaterThan(0);

    for (const group of groups) {
      // Marker may be applied at container-level OR on the first focusable child.
      let marker: globalThis.HTMLElement | null = null;
      if (group.hasAttribute('data-group-first')) {
        marker = group;
      } else {
        marker = group.querySelector('[data-group-first]') as globalThis.HTMLElement | null;
      }
      expect(
        marker,
        'group must have a data-group-first marker (self or descendant)'
      ).not.toBeNull();

      // Ensure uniqueness: no additional descendant markers beyond the chosen one.
      const allDesc = Array.from(group.querySelectorAll('[data-group-first]'));
      if (group.hasAttribute('data-group-first')) {
        // If container has marker, there should be no extra descendant markers.
        expect(allDesc.length).toBe(0);
      } else {
        expect(allDesc.length).toBe(1);
      }

      const focusables = getFocusable(group);
      const groupName = group.getAttribute('data-toolbar-group');
      if (focusables.length === 0) {
        // 허용 예외: counter 그룹은 상호작용 요소(버튼) 없이 정보만 표시
        expect(groupName).toBe('counter');
        continue;
      }
      const first = focusables[0];
      // Container-level marker: marker contains first. Child-level marker: marker === first or contains.
      const valid = marker === first || marker.contains(first) || first.contains(marker);
      expect(valid).toBe(true);
    }
  });
});
