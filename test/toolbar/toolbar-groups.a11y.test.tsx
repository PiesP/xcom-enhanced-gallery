import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import { Toolbar, type ToolbarProps } from '@shared/components/ui/Toolbar/Toolbar';

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
  getToolbarClassName: vi.fn((_s: unknown, base: string) => base || 'toolbar'),
}));

vi.mock('@shared/utils', () => ({
  throttleScroll: (fn: (event?: Event) => void) => fn,
}));

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

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  cleanup();
});

/**
 * GREEN (P4): 그룹화 & 포커스 순서 보호 - 구현 검증
 */

describe('TBAR-R P4 GREEN: toolbar grouping & focus order guards', () => {
  it('각 섹션이 data-toolbar-group 속성을 가진다', () => {
    render(() => <Toolbar {...mkProps()} />);
    const toolbar = screen.getByRole('toolbar');
    const groups = Array.from(toolbar.querySelectorAll('[data-toolbar-group]'));
    expect(groups.length).toBe(3);
    const names = groups.map(g => g.getAttribute('data-toolbar-group'));
    expect(names).toEqual(['navigation', 'counter', 'actions']);
  });

  it('그룹 순서가 navigation -> counter -> actions 이다', () => {
    render(() => <Toolbar {...mkProps()} />);
    const toolbar = screen.getByRole('toolbar');
    const groups = Array.from(toolbar.querySelectorAll('[data-toolbar-group]'));
    const order = groups.map(g => g.getAttribute('data-toolbar-group'));
    expect(order).toEqual(['navigation', 'counter', 'actions']);
  });

  it('각 그룹 첫 요소에 data-group-first="true" 표시', () => {
    render(() => <Toolbar {...mkProps()} />);
    const toolbar = screen.getByRole('toolbar');
    const firstMarkers = Array.from(toolbar.querySelectorAll('[data-group-first="true"]'));
    expect(firstMarkers.length).toBe(3);
  });
});
