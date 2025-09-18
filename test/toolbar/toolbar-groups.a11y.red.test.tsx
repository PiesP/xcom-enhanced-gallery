import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { h } from 'preact';

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

/**
 * RED (P4): 그룹화 & 포커스 순서 보호를 위한 초기 실패 테스트
 * 요구 사항:
 *  1. 각 주요 섹션에 data-toolbar-group="<name>" 존재 (navigation | counter | actions)
 *  2. DOM 내 그룹 순서: navigation -> counter -> actions
 *  3. 각 그룹 내 첫 번째 버튼에 data-group-first="true" 표시 (접근성 안내)
 */

describe('TBAR-R P4 RED: toolbar grouping & focus order guards', () => {
  it('각 섹션이 data-toolbar-group 속성을 가진다', () => {
    render(h(Toolbar as any, mkProps()));
    const toolbar = screen.getByRole('toolbar');
    const groups = Array.from(toolbar.querySelectorAll('[data-toolbar-group]'));
    // 아직 구현 전이므로 실패를 기대 -> 임시 기대값 0
    expect(groups.length).toBeGreaterThan(0); // RED: 현재 0이라 실패해야 함
  });

  it('그룹 순서가 navigation -> counter -> actions 이다', () => {
    render(h(Toolbar as any, mkProps()));
    const toolbar = screen.getByRole('toolbar');
    const groups = Array.from(toolbar.querySelectorAll('[data-toolbar-group]'));
    const order = groups.map(g => g.getAttribute('data-toolbar-group'));
    expect(order).toEqual(['navigation', 'counter', 'actions']); // RED
  });

  it('각 그룹 첫 버튼이 data-group-first="true"를 가진다', () => {
    render(h(Toolbar as any, mkProps()));
    const toolbar = screen.getByRole('toolbar');
    const firstMarkers = Array.from(toolbar.querySelectorAll('[data-group-first="true"]'));
    expect(firstMarkers.length).toBe(3); // navigation/counter(actions center only has counter)/actions
  });
});
