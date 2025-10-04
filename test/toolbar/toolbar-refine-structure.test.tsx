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

/**
 * Toolbar 구조/스타일 하드닝 (TBAR-R Selector Consolidation Graduation)
 * - 하드코딩 치수 제거(2.5em 없음)
 * - .toolbarButton 셀렉터 중복 최소화 (base + 상태 변형 1회 정의로 집계  <= 3 허용)
 * - MediaCounter forward 스타일 부재
 * - DOM 섹션 순서 a11y (navigation-left -> counter-section -> actions-right)
 */

describe('Toolbar refinement (selector consolidation + structure)', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('removes legacy hardcoded 2.5em dimension usages', () => {
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
    const occurrences =
      (buttonCss.match(/2\.5em/g) || []).length + (toolbarCss.match(/2\.5em/g) || []).length;
    expect(occurrences).toBe(0);
  });

  it('consolidates .toolbarButton selector occurrences to small bounded count', () => {
    const toolbarCss = readProjectFile([
      'src',
      'shared',
      'components',
      'ui',
      'Toolbar',
      'Toolbar.module.css',
    ]);
    const occurrences = (toolbarCss.match(/\.toolbarButton/g) || []).length;
    // 허용: base + active + hover(통합) + focus-visible + selected + selected:hover (<=6)
    expect(occurrences).toBeLessThanOrEqual(6);
  });

  it('omits MediaCounter forward styles from Toolbar CSS', () => {
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

  it('renders sections in correct accessible order', () => {
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
});
