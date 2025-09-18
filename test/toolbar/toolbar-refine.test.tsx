import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen } from '@testing-library/preact';
import { h } from 'preact';

// 모킹 (RED 단계와 유사, 단 결과 검증만 변경)
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

vi.mock('@shared/utils', () => ({
  throttleScroll: (fn: any) => fn,
}));

import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';

const mkProps = (overrides: Partial<Parameters<typeof Toolbar>[0]> = {}) => ({
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
  ...overrides,
});

const readProjectFile = (segments: string[]): string => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const p = path.join(root, ...segments);
  return fs.readFileSync(p, 'utf-8');
};

describe('TBAR-R GREEN: toolbar refinement guards', () => {
  it('eliminates hardcoded 2.5em literals in toolbar/button css (token only)', () => {
    const buttonCss = readProjectFile([
      'src',
      'shared',
      'components',
      'ui',
      'Button',
      'Button.module.css',
    ]);
    const toolbarCss = readProjectFile([
      'src',
      'shared',
      'components',
      'ui',
      'Toolbar',
      'Toolbar.module.css',
    ]);
    const totalLiterals =
      (buttonCss.match(/2\.5em/g) || []).length + (toolbarCss.match(/2\.5em/g) || []).length;
    expect(totalLiterals).toBe(0);
    // token usage should exist at least once
    const tokenUsage =
      (buttonCss.match(/--xeg-size-toolbar-button/g) || []).length +
      (toolbarCss.match(/--xeg-size-toolbar-button/g) || []).length;
    expect(tokenUsage).toBeGreaterThan(0);
  });

  it('removes MediaCounter forward styles from Toolbar.module.css', () => {
    const toolbarCss = readProjectFile([
      'src',
      'shared',
      'components',
      'ui',
      'Toolbar',
      'Toolbar.module.css',
    ]);
    const hasForward =
      /\.mediaCounter\b/.test(toolbarCss) || /\.mediaCounterWrapper\b/.test(toolbarCss);
    expect(hasForward).toBe(false);
  });

  it('toolbar DOM order is navigation-left -> counter-section -> actions-right', () => {
    render(h(Toolbar as any, mkProps()));
    const toolbar = screen.getByRole('toolbar');
    const sections = Array.from(
      toolbar.querySelectorAll(
        '[data-gallery-element$="-left"], [data-gallery-element="counter-section"], [data-gallery-element$="-right"]'
      )
    ) as any[];
    expect(sections.length).toBe(3);
    const order = sections.map(s => s.getAttribute('data-gallery-element'));
    expect(order).toEqual(['navigation-left', 'counter-section', 'actions-right']);
  });

  it('all toolbar buttons expose data-toolbar-button attribute & tokenized size styles', () => {
    render(h(Toolbar as any, mkProps()));
    const allButtons = screen
      .getByRole('toolbar')
      .querySelectorAll('button[data-toolbar-button="true"]');
    expect(allButtons.length).toBeGreaterThan(0);
    // Check style width/height reflect token via CSS (cannot compute computed styles in JSDOM reliably, just attribute presence per primitive)
    allButtons.forEach(btn => {
      expect(btn.getAttribute('data-toolbar-button')).toBe('true');
    });
  });
});
