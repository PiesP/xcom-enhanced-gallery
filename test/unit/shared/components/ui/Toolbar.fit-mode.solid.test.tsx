/** @jsxImportSource solid-js */
/**
 * @fileoverview Toolbar fit-mode hydration/spec tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import { Toolbar, type ToolbarProps } from '@shared/components/ui/Toolbar/Toolbar';

vi.mock('@shared/components/ui/Toolbar/Toolbar.module.css', () => ({
  default: new Proxy({}, { get: () => '' }),
}));

vi.mock('@shared/components/ui/ToolbarButton/ToolbarButton.module.css', () => ({
  default: new Proxy({}, { get: () => '' }),
}));

vi.mock('@shared/components/LazyIcon', () => ({
  LazyIcon: () => <i data-testid='lazy-icon-mock' />,
}));

vi.mock('@shared/hooks/useToolbarState', () => {
  const setCurrentFitMode = vi.fn();
  const setNeedsHighContrast = vi.fn();
  const setDownloading = vi.fn();
  return {
    useToolbarState: () => [
      {
        isDownloading: false,
        isLoading: false,
        hasError: false,
        currentFitMode: 'fitWidth',
        needsHighContrast: false,
      },
      {
        setDownloading,
        setLoading: vi.fn(),
        setError: vi.fn(),
        setCurrentFitMode,
        setNeedsHighContrast,
        resetState: vi.fn(),
      },
    ],
    getToolbarDataState: () => 'idle',
    getToolbarClassName: () => 'toolbar-class',
  };
});

vi.mock('@shared/utils', () => ({
  throttleScroll: (fn: (event?: Event) => void) => fn,
}));

describe('Toolbar fit-mode selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const baseProps: ToolbarProps = {
    currentIndex: 0,
    totalCount: 3,
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
  };

  it('defaults to internal fitWidth when no prop provided', () => {
    render(() => <Toolbar {...baseProps} />);
    const fitWidthBtn = screen.getByLabelText('Fit to width');
    expect(fitWidthBtn).toHaveAttribute('data-selected', 'true');
  });

  it('honors currentFitMode="fitContainer" prop on initial render', () => {
    render(() => <Toolbar {...baseProps} currentFitMode='fitContainer' />);
    const fitContainerBtn = screen.getByLabelText('Fit to window');
    const fitWidthBtn = screen.getByLabelText('Fit to width');
    expect(fitContainerBtn).toHaveAttribute('data-selected', 'true');
    expect(fitWidthBtn).not.toHaveAttribute('data-selected', 'true');
  });
});
