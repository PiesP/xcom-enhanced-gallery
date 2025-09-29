/** @jsxImportSource solid-js */
/**
 * @fileoverview Toolbar Icons Integration Tests
 * @version 1.0.0 - 툴바 아이콘 교체 테스트
 */

import type { JSX } from 'solid-js';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, waitFor } from '@solidjs/testing-library';

// Hooks mock
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
  getToolbarClassName: vi.fn(() => 'toolbar'),
}));

// Utils mock
vi.mock('@shared/utils', () => ({
  throttleScroll: vi.fn(fn => fn),
}));

// StandardProps mock
vi.mock('@shared/components/ui/StandardProps', () => ({
  ComponentStandards: {
    createClassName: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
  },
}));

// CSS 모듈 mock
vi.mock('@shared/components/ui/Toolbar/Toolbar.module.css', () => ({
  default: {
    toolbar: 'toolbar',
    toolbarContent: 'toolbarContent',
    toolbarSection: 'toolbarSection',
    toolbarLeft: 'toolbarLeft',
    toolbarCenter: 'toolbarCenter',
    toolbarRight: 'toolbarRight',
    toolbarButton: 'toolbarButton',
    navButton: 'navButton',
    downloadButton: 'downloadButton',
    downloadCurrent: 'downloadCurrent',
    downloadAll: 'downloadAll',
    closeButton: 'closeButton',
    settingsButton: 'settingsButton',
    fitButton: 'fitButton',
    fitModeGroup: 'fitModeGroup',
    mediaCounterWrapper: 'mediaCounterWrapper',
    mediaCounter: 'mediaCounter',
    currentIndex: 'currentIndex',
    separator: 'separator',
    totalCount: 'totalCount',
    progressBar: 'progressBar',
    progressFill: 'progressFill',
    downloadSpinner: 'downloadSpinner',
  },
}));

vi.mock('@shared/services/iconRegistry', () => {
  const loaded = new Map<string, (props: Record<string, unknown>) => JSX.Element>();
  const createIconComponent = (name: string) => (props: Record<string, unknown>) => (
    <svg viewBox='0 0 24 24' data-testid={`icon-${name}`} {...props}>
      <path aria-hidden='true' />
    </svg>
  );

  const getLoadedIconSync = (name: string) => {
    if (!loaded.has(name)) {
      loaded.set(name, createIconComponent(name));
    }
    return loaded.get(name) ?? null;
  };

  const loadIcon = vi.fn((name: string) => Promise.resolve(getLoadedIconSync(name)!));

  return {
    getIconRegistry: () => ({
      getLoadedIconSync,
      loadIcon,
    }),
    preloadCommonIcons: vi.fn(() => Promise.resolve()),
  };
});

import { Toolbar, type ToolbarProps } from '@shared/components/ui/Toolbar/Toolbar';

describe('Toolbar Icons Integration', () => {
  afterEach(() => {
    cleanup();
  });

  const noop = () => void 0;
  const baseToolbarProps: ToolbarProps = {
    currentIndex: 0,
    totalCount: 3,
    isDownloading: false,
    disabled: false,
    onPrevious: noop,
    onNext: noop,
    onDownloadCurrent: noop,
    onDownloadAll: noop,
    onClose: noop,
    onOpenSettings: noop,
    onFitOriginal: noop,
    onFitWidth: noop,
    onFitHeight: noop,
    onFitContainer: noop,
  };

  const renderToolbar = (overrides: Partial<ToolbarProps> = {}) =>
    render(() => <Toolbar {...baseToolbarProps} {...overrides} />);

  describe('네비게이션 아이콘', () => {
    it('이전 버튼에 chevron-left 아이콘이 렌더링되어야 함', async () => {
      const { container } = renderToolbar({
        currentIndex: 1,
        totalCount: 3,
      });

      const prevButton = container.querySelector('[data-gallery-element="nav-previous"]');
      expect(prevButton).toBeTruthy();
      await waitFor(() => {
        const svg = prevButton?.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      });
    });

    it('다음 버튼에 chevron-right 아이콘이 렌더링되어야 함', async () => {
      const { container } = renderToolbar({
        currentIndex: 0,
        totalCount: 3,
      });

      const nextButton = container.querySelector('[data-gallery-element="nav-next"]');
      expect(nextButton).toBeTruthy();
      await waitFor(() => {
        const svg = nextButton?.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      });
    });
  });

  describe('액션 아이콘', () => {
    it('다운로드 버튼에 download 아이콘이 렌더링되어야 함', async () => {
      const { container } = renderToolbar({
        currentIndex: 0,
        totalCount: 3,
      });

      const downloadButton = container.querySelector('[data-gallery-element="download-current"]');
      expect(downloadButton).toBeTruthy();
      await waitFor(() => {
        const svg = downloadButton?.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      });
    });

    it('전체 다운로드 버튼에 file-zip 아이콘이 렌더링되어야 함', async () => {
      const { container } = renderToolbar({
        currentIndex: 0,
        totalCount: 3,
      });

      const downloadAllButton = container.querySelector('[data-gallery-element="download-all"]');
      expect(downloadAllButton).toBeTruthy();
      await waitFor(() => {
        const svg = downloadAllButton?.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      });
    });

    it('닫기 버튼에 x 아이콘이 렌더링되어야 함', async () => {
      const { container } = renderToolbar({
        currentIndex: 0,
        totalCount: 3,
      });

      const closeButton = container.querySelector('[data-gallery-element="close"]');
      expect(closeButton).toBeTruthy();
      await waitFor(() => {
        const svg = closeButton?.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      });
    });
  });

  describe('핏 모드 아이콘', () => {
    it('원본 크기 버튼에 zoom-in 아이콘이 렌더링되어야 함', async () => {
      const { container } = renderToolbar({
        currentIndex: 0,
        totalCount: 3,
      });

      const fitOriginalButton = container.querySelector('[data-gallery-element="fit-original"]');
      expect(fitOriginalButton).toBeTruthy();
      await waitFor(() => {
        const svg = fitOriginalButton?.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      });
    });
  });
});
