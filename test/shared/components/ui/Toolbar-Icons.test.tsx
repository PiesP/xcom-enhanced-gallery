/**
 * @fileoverview Toolbar Icons Integration Tests
 * @version 1.0.0 - 툴바 아이콘 교체 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/preact';
import { h } from 'preact';

// Vendor mocks 먼저 설정
vi.mock('@shared/external/vendors', () => ({
  getFflate: vi.fn(() => ({})),
  getPreact: vi.fn(() => ({ h })),
  getPreactHooks: vi.fn(() => ({
    // LazyIcon이 stateful로 변경되었으므로 useState/즉시 실행 useEffect 모킹 필요
    useState: vi.fn(initial => [initial, vi.fn()]),
    useMemo: vi.fn(factory => factory()),
    useCallback: vi.fn(callback => callback),
    // 아이콘 동적 로드를 트리거하기 위해 즉시 실행
    useEffect: vi.fn(effect => {
      if (typeof effect === 'function') {
        // cleanup 무시
        effect();
      }
    }),
    useRef: vi.fn(() => ({ current: null })),
  })),
  getPreactSignals: vi.fn(() => ({})),
  getPreactCompat: vi.fn(() => ({
    memo: vi.fn(Component => Component),
    forwardRef: vi.fn(Component => Component),
  })),
  getNativeDownload: vi.fn(() => ({})),
  initializeVendors: vi.fn(() => Promise.resolve()),
  cleanupVendors: vi.fn(() => Promise.resolve()),
  getVendorVersions: vi.fn(() => ({})),
  isVendorsInitialized: vi.fn(() => true),
  getVendorInitializationReport: vi.fn(() => ({})),
  getVendorStatuses: vi.fn(() => ({})),
  isVendorInitialized: vi.fn(() => true),
}));

// 아이콘 레지스트리/아이콘 컴포넌트 동기 모킹 (LazyIcon 비동기 로딩 우회)
vi.mock('@shared/services/iconRegistry', () => {
  const loaded: Record<string, () => unknown> = {};
  const create = (name: string) => () =>
    h(
      'svg',
      {
        'data-testid': `icon-${name}`,
        viewBox: '0 0 24 24',
        role: 'img',
        width: 24,
        height: 24,
      },
      h('title', {}, name)
    );
  const names = [
    'Download',
    'Settings',
    'Close',
    'ChevronLeft',
    'ChevronRight',
    'ZoomIn',
    'ArrowAutofitWidth',
    'ArrowAutofitHeight',
    'ArrowsMaximize',
    'FileZip',
  ];
  for (const n of names) loaded[n] = create(n);
  return {
    getIconRegistry: () => ({
      loadIcon: (name: string) => Promise.resolve(loaded[name]),
      getLoadedIconSync: (name: string) => loaded[name] ?? null,
      isLoading: () => false,
      setFallbackIcon: () => void 0,
      getCachedIcon: () => null,
      setCachedIcon: () => void 0,
      clearCache: () => void 0,
      clearAllCaches: () => void 0,
      getDebugInfo: () => ({ loadingCount: 0, loadingIcons: [] }),
    }),
    preloadCommonIcons: () => Promise.resolve(),
  };
});

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

import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';

describe('Toolbar Icons Integration', () => {
  beforeEach(() => {
    // 각 테스트 전 정리
  });

  afterEach(() => {
    cleanup();
  });

  describe('네비게이션 아이콘', () => {
    it('이전 버튼에 chevron-left 아이콘이 렌더링되어야 함', async () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 1,
          totalCount: 3,
          onPrevious: () => {},
          onNext: () => {},
          onClose: () => {},
          onDownloadCurrent: () => {},
          onDownloadAll: () => {},
        })
      );

      const prevButton = container.querySelector('[data-gallery-element="nav-previous"]');
      expect(prevButton).toBeTruthy();
      await waitFor(() => {
        const svg = prevButton?.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      });
    });

    it('다음 버튼에 chevron-right 아이콘이 렌더링되어야 함', async () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 0,
          totalCount: 3,
          onPrevious: () => {},
          onNext: () => {},
          onClose: () => {},
          onDownloadCurrent: () => {},
          onDownloadAll: () => {},
        })
      );

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
      const { container } = render(
        h(Toolbar, {
          currentIndex: 0,
          totalCount: 3,
          onPrevious: () => {},
          onNext: () => {},
          onClose: () => {},
          onDownloadCurrent: () => {},
          onDownloadAll: () => {},
        })
      );

      const downloadButton = container.querySelector('[data-gallery-element="download-current"]');
      expect(downloadButton).toBeTruthy();
      await waitFor(() => {
        const svg = downloadButton?.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      });
    });

    it('전체 다운로드 버튼에 file-zip 아이콘이 렌더링되어야 함', async () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 0,
          totalCount: 3,
          onPrevious: () => {},
          onNext: () => {},
          onClose: () => {},
          onDownloadCurrent: () => {},
          onDownloadAll: () => {},
        })
      );

      const downloadAllButton = container.querySelector('[data-gallery-element="download-all"]');
      expect(downloadAllButton).toBeTruthy();
      await waitFor(() => {
        const svg = downloadAllButton?.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      });
    });

    it('닫기 버튼에 x 아이콘이 렌더링되어야 함', async () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 0,
          totalCount: 3,
          onPrevious: () => {},
          onNext: () => {},
          onClose: () => {},
          onDownloadCurrent: () => {},
          onDownloadAll: () => {},
        })
      );

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
      const { container } = render(
        h(Toolbar, {
          currentIndex: 0,
          totalCount: 3,
          onPrevious: () => {},
          onNext: () => {},
          onClose: () => {},
          onDownloadCurrent: () => {},
          onDownloadAll: () => {},
          onFitOriginal: () => {},
          onFitWidth: () => {},
          onFitHeight: () => {},
          onFitContainer: () => {},
        })
      );

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
