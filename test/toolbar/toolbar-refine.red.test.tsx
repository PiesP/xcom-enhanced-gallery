import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen } from '@testing-library/preact';
import { h } from 'preact';

// 최소 모킹: Toolbar 내부 훅/벤더 (기존 접근성 테스트 패턴 참고)
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

// Helper: read file text
const readProjectFile = (segments: string[]): string => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const p = path.join(root, ...segments);
  return fs.readFileSync(p, 'utf-8');
};

/**
 * P1 RED 테스트 (TBAR-R Phase 1)
 * - 의도: 현재 중복/하드코딩/순서 문제를 문서화하고 안전하게 GREEN 단계에서 수정
 * - 역논리(assert 실패 유도)로 현재 상태를 RED 고정
 */

describe('TBAR-R P1 RED: toolbar refinement guards (intentional failures)', () => {
  it('should already have eliminated hardcoded 2.5em usages (expecting token only) — FORCE RED', () => {
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
    // Count raw 2.5em occurrences excluding design tokens file (not read here)
    const occurrences =
      (buttonCss.match(/2\.5em/g) || []).length + (toolbarCss.match(/2\.5em/g) || []).length;
    // GREEN 목표: occurrences === 0 이지만 현재는 > 0. 여기서 역논리로 0을 기대 → 실패
    expect(occurrences).toBe(0);
  });

  it('should have single .toolbarButton selector definition only — FORCE RED', () => {
    const toolbarCss = readProjectFile([
      'src',
      'shared',
      'components',
      'ui',
      'Toolbar',
      'Toolbar.module.css',
    ]);
    const occurrences = (toolbarCss.match(/\.toolbarButton/g) || []).length;
    // 실제는 다수 상태 변형 등으로 여러 번 등장. 목표: 구조 재편 후 선택자 정의 1회(or base + states) 측정 테스트 분리 예정
    expect(occurrences).toBeLessThanOrEqual(1); // RED 예상
  });

  it('should NOT contain MediaCounter forward styles inside Toolbar.module.css — FORCE RED', () => {
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
    // GREEN 목표: hasForward === false. 현재 true → 역논리 실패
    expect(hasForward).toBe(false);
  });

  it('toolbar DOM order a11y: navigation-left -> counter-section -> actions-right already enforced — FORCE RED', () => {
    render(h(Toolbar as any, mkProps()));
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toBeTruthy();
    const sections = Array.from(
      toolbar.querySelectorAll(
        '[data-gallery-element$="-left"], [data-gallery-element="counter-section"], [data-gallery-element$="-right"]'
      )
      // Cast to any to avoid dependency on DOM lib typings in this isolated RED test context
    ) as any[];
    // Expect 3 sections
    expect(sections.length).toBe(3);
    const order = sections.map(s => s.getAttribute('data-gallery-element'));
    // GREEN 목표: ['navigation-left','counter-section','actions-right'] 정확 순서. 역논리로 다른 배열을 기대 → 실패
    expect(order).toEqual(['counter-section', 'navigation-left', 'actions-right']);
  });
});
