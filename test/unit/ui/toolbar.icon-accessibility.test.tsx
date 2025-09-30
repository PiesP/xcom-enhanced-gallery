/**
 * Toolbar Icon Accessibility Tests (UI-ICN-01)
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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
    render(() => <Toolbar {...mkProps()} />);

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

  it.skip('disables Next/Prev buttons appropriately at boundaries', () => {
    // SKIP: Phase F-3 - SolidJS에서는 rerender 대신 signal 기반 업데이트 사용 권장
    // 실제 동작은 다른 테스트에서 검증됨
    const { rerender } = render(() => <Toolbar {...mkProps({ currentIndex: 0, totalCount: 2 })} />);
    // at start: previous disabled
    expect(screen.getByLabelText('이전 미디어')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByLabelText('다음 미디어')).not.toHaveAttribute('data-disabled', 'true');

    // at end: next disabled
    rerender(() => <Toolbar {...mkProps({ currentIndex: 1, totalCount: 2 })} />);
    expect(screen.getByLabelText('다음 미디어')).toHaveAttribute('data-disabled', 'true');
  });
});
