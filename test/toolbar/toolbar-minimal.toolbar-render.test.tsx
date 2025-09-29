/** @jsxImportSource solid-js */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render } from '@solidjs/testing-library';

vi.mock('@shared/hooks/useToolbarState', () => ({
  useToolbarState: () => [
    {
      isDownloading: false,
      isLoading: false,
      hasError: false,
      currentFitMode: 'original',
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
  getToolbarClassName: () => 'toolbar',
}));
vi.mock('@shared/utils', () => ({ throttleScroll: (fn: any) => fn }));
import { Toolbar } from '@/shared/components/ui/Toolbar/Toolbar';

// GREEN: 최소 렌더 회귀 방지 (과거 hang 재발 차단)

describe('toolbar minimal render', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders toolbar without interaction', () => {
    const { getByRole } = render(() => (
      <Toolbar
        currentIndex={0}
        totalCount={1}
        onPrevious={() => {}}
        onNext={() => {}}
        onDownloadCurrent={() => {}}
        onDownloadAll={() => {}}
        onClose={() => {}}
      />
    ));
    const toolbar = getByRole('toolbar');
    expect(toolbar).toBeTruthy();
  });
});
