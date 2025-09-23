/**
 * @fileoverview Toolbar fit-mode hydration/spec tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPreact } from '@shared/external/vendors';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';

// Minimal vendor mocks suitable for unit vnode assertions
vi.mock('@shared/external/vendors', () => ({
  getPreact: () => ({
    h: function (tag: any, props: any, ...children: any[]) {
      const flat = children.flat().filter(Boolean);
      if (typeof tag === 'function') {
        return tag(props || {});
      }
      return { tag, props: props || {}, children: flat };
    },
    Fragment: 'Fragment',
  }),
  getPreactHooks: () => ({
    useState: vi.fn((init: any) => [init, vi.fn()]),
    useEffect: vi.fn(),
    useMemo: vi.fn((fn: any) => fn()),
    useCallback: vi.fn((fn: any) => fn),
    useRef: vi.fn(() => ({ current: null })),
  }),
  getPreactCompat: () => ({
    memo: (c: any) => c,
  }),
}));

vi.mock('@shared/components/ui/Toolbar/Toolbar.module.css', () => ({
  default: new Proxy({}, { get: () => '' }),
}));

vi.mock('@shared/components/ui/ToolbarButton/ToolbarButton.module.css', () => ({
  default: new Proxy({}, { get: () => '' }),
}));

vi.mock('@shared/components/LazyIcon', () => ({
  LazyIcon: () => ({ tag: 'i', props: {}, children: [] }),
}));

// useToolbarState default internal mode = fitWidth
vi.mock('@shared/hooks/useToolbarState', () => ({
  useToolbarState: () => [
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
  ],
  getToolbarDataState: () => 'idle',
  getToolbarClassName: () => 'toolbar-class',
}));

// ToolbarButton primitive
vi.mock('@shared/components/ui/ToolbarButton/ToolbarButton', () => ({
  ToolbarButton: (props: any) => {
    const mapped = {
      ...props,
      'data-selected': props.selected ?? undefined,
    };
    return { tag: 'button', props: mapped, children: [] };
  },
}));

// Standard props
vi.mock('@shared/components/ui/StandardProps', () => ({
  ComponentStandards: { createClassName: (...c: string[]) => c.filter(Boolean).join(' ') },
}));

function collectButtons(node: any) {
  const out: any[] = [];
  const walk = (n: any) => {
    if (!n) return;
    if (n.tag === 'button') out.push(n);
    if (Array.isArray(n.children)) n.children.forEach(walk);
  };
  walk(node);
  return out;
}

describe('Toolbar fit-mode selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseProps = {
    currentIndex: 0,
    totalCount: 3,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
    onClose: vi.fn(),
  };

  it('defaults to internal fitWidth when no prop provided', () => {
    const { h } = getPreact();
    const vnode: any = h(Toolbar as any, baseProps);
    const buttons = collectButtons(vnode);
    const fitWidthBtn = buttons.find(b => b?.props?.['data-gallery-element'] === 'fit-width');
    expect(fitWidthBtn?.props?.['data-selected']).toBe(true);
  });

  it('honors currentFitMode="fitContainer" prop on initial render', () => {
    const { h } = getPreact();
    const vnode: any = h(Toolbar as any, { ...baseProps, currentFitMode: 'fitContainer' });
    const buttons = collectButtons(vnode);
    const fitContainerBtn = buttons.find(
      b => b?.props?.['data-gallery-element'] === 'fit-container'
    );
    const fitWidthBtn = buttons.find(b => b?.props?.['data-gallery-element'] === 'fit-width');
    expect(fitContainerBtn?.props?.['data-selected']).toBe(true);
    expect(fitWidthBtn?.props?.['data-selected']).not.toBe(true);
  });
});
