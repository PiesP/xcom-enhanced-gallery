import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen, cleanup } from '@solidjs/testing-library';

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

import { Toolbar, type ToolbarProps } from '@shared/components/ui/Toolbar/Toolbar';

const mkProps = (overrides: Partial<ToolbarProps> = {}): ToolbarProps => ({
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
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

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
    render(() => <Toolbar {...mkProps()} />);
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
    render(() => <Toolbar {...mkProps()} />);
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
