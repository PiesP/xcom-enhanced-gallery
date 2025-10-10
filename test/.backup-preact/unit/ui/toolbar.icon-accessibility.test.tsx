/**
 * Toolbar Icon Accessibility Tests (UI-ICN-01)
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, cleanup, h } from '../../utils/testing-library';

// Vendors/Hook/Utils 모킹: 툴바 내부의 사이드이펙트(useEffect, vendors 초기화)로 인한 테스트 정지 방지
vi.mock('@shared/external/vendors', () => ({
  getFflate: vi.fn(() => ({})),
  getPreact: vi.fn(() => ({ h })),
  getPreactHooks: vi.fn(() => ({
    useMemo: (fn: any, _deps?: any) => fn(),
    useCallback: (fn: any) => fn,
    useEffect: (_fn: any, _deps?: any) => void 0,
    useRef: (init?: any) => ({ current: init ?? null }),
  })),
  getPreactSignals: vi.fn(() => ({})),
  getPreactCompat: vi.fn(() => ({ memo: (C: any) => C, forwardRef: (C: any) => C })),
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
  totalCount: 3,
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

describe('Toolbar - Icon accessibility (UI-ICN-01)', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders toolbar with accessible icon buttons (aria-label present)', () => {
    render(h(Toolbar as any, mkProps()));

    // toolbar container
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toBeTruthy();

    // navigation
    expect(screen.getByLabelText('이전 미디어')).toBeTruthy();
    expect(screen.getByLabelText('다음 미디어')).toBeTruthy();

    // fit modes
    expect(screen.getByLabelText('원본 크기')).toBeTruthy();
    expect(screen.getByLabelText('가로에 맞춤')).toBeTruthy();
    expect(screen.getByLabelText('세로에 맞춤')).toBeTruthy();
    expect(screen.getByLabelText('창에 맞춤')).toBeTruthy();

    // download actions
    expect(screen.getByLabelText('현재 파일 다운로드')).toBeTruthy();
    expect(screen.getByLabelText('전체 3개 파일 ZIP 다운로드')).toBeTruthy();

    // settings & close
    expect(screen.getByLabelText('설정 열기')).toBeTruthy();
    expect(screen.getByLabelText('갤러리 닫기')).toBeTruthy();
  });

  it('disables Next/Prev buttons appropriately at boundaries', () => {
    const { rerender } = render(h(Toolbar as any, mkProps({ currentIndex: 0, totalCount: 2 })));
    // at start: previous disabled
    expect(screen.getByLabelText('이전 미디어')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByLabelText('다음 미디어')).not.toHaveAttribute('data-disabled', 'true');

    // at end: next disabled
    rerender(h(Toolbar as any, mkProps({ currentIndex: 1, totalCount: 2 })));
    expect(screen.getByLabelText('다음 미디어')).toHaveAttribute('data-disabled', 'true');
  });
});
