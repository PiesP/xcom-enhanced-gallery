/**
 * @fileoverview Toolbar Characterization Tests (TDD Phase P0)
 * @description 현재 툴바 구현의 기본 특성을 테스트로 문서화
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/preact';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { ToolbarHeadless } from '@shared/components/ui/Toolbar/ToolbarHeadless';

// Mock external dependencies
vi.mock('@shared/external/vendors', () => ({
  getPreact: () => ({
    h: (tag: string, props: unknown, ...children: unknown[]) => ({ tag, props, children }),
    Fragment: 'Fragment',
  }),
  getPreactHooks: () => ({
    useState: vi.fn(initial => [initial, vi.fn()]),
    useEffect: vi.fn(),
    useMemo: vi.fn(fn => fn()),
    useCallback: vi.fn(fn => fn),
    useRef: vi.fn(() => ({ current: null })),
  }),
  getPreactCompat: () => ({
    memo: vi.fn(component => component),
  }),
}));

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
  getToolbarClassName: () => 'toolbar-class',
}));

vi.mock('@shared/state/signals/toolbar.signals', () => ({
  toolbarState: {
    value: {
      currentMode: 'gallery',
      needsHighContrast: false,
    },
    subscribe: vi.fn(() => vi.fn()),
  },
  updateToolbarMode: vi.fn(),
  setHighContrast: vi.fn(),
}));

vi.mock('@shared/utils', () => ({
  throttleScroll: vi.fn(fn => fn),
}));

vi.mock('@shared/components/ui/StandardProps', () => ({
  ComponentStandards: {
    createClassName: (...classes: string[]) => classes.filter(Boolean).join(' '),
  },
}));

vi.mock('@shared/components/ui/Icon', () => ({
  ChevronLeft: () => 'ChevronLeft',
  ChevronRight: () => 'ChevronRight',
  Download: () => 'Download',
  FileZip: () => 'FileZip',
  Settings: () => 'Settings',
  X: () => 'X',
  ZoomIn: () => 'ZoomIn',
  ArrowAutofitWidth: () => 'ArrowAutofitWidth',
  ArrowAutofitHeight: () => 'ArrowAutofitHeight',
  ArrowsMaximize: () => 'ArrowsMaximize',
}));

describe('Toolbar Characterization (P0)', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('기본 구조 특성화', () => {
    it('Toolbar 컴포넌트가 정의되어 있어야 함', () => {
      expect(Toolbar).toBeDefined();
      expect(typeof Toolbar).toBe('function');
    });

    it('ToolbarHeadless 컴포넌트가 정의되어 있어야 함', () => {
      expect(ToolbarHeadless).toBeDefined();
      expect(typeof ToolbarHeadless).toBe('function');
    });

    it('필수 props 타입이 올바르게 정의되어야 함', () => {
      const mockProps = {
        currentIndex: 0,
        totalCount: 5,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
      };

      expect(() => Toolbar(mockProps)).not.toThrow();
    });
  });

  describe('버튼 구조 특성화', () => {
    const mockProps = {
      currentIndex: 2,
      totalCount: 5,
      isDownloading: false,
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

    it('툴바 기본 구조가 올바르게 생성되어야 함', () => {
      const result = Toolbar(mockProps) as any;

      expect(result).toBeDefined();
      expect(result.tag).toBe('div');
      expect(result.props.role).toBe('toolbar');
      expect(result.props['aria-label']).toBe('갤러리 도구모음');
    });

    it('네비게이션 버튼들이 존재해야 함', () => {
      const result = Toolbar(mockProps) as any;
      const leftSection = result.children[0].children[0];

      expect(leftSection.props.className).toContain('toolbarLeft');
      expect(leftSection.children).toHaveLength(2); // previous, next 버튼
    });

    it('다운로드 버튼이 존재해야 함', () => {
      const result = Toolbar(mockProps) as any;
      const rightSection = result.children[0].children[2];

      // 다운로드 관련 버튼 확인
      const downloadButtons = rightSection.children.filter((child: any) =>
        child.props?.className?.includes('downloadButton')
      );
      expect(downloadButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('핏 모드 버튼 그룹이 존재해야 함', () => {
      const result = Toolbar(mockProps) as any;
      const rightSection = result.children[0].children[2];

      const fitModeGroup = rightSection.children.find((child: any) =>
        child.props?.className?.includes('fitModeGroup')
      );
      expect(fitModeGroup).toBeDefined();
      expect(fitModeGroup.children).toHaveLength(4); // original, width, height, container
    });
  });

  describe('접근성 특성화', () => {
    it('모든 버튼이 aria-label을 가져야 함', () => {
      const mockProps = {
        currentIndex: 0,
        totalCount: 3,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
      };

      const result = Toolbar(mockProps) as any;

      // 모든 버튼 요소 수집
      const collectButtons = (node: any): any[] => {
        if (!node) return [];
        if (node.tag === 'button') return [node];
        if (Array.isArray(node.children)) {
          return node.children.flatMap(collectButtons);
        }
        return [];
      };

      const buttons = collectButtons(result);

      buttons.forEach(button => {
        expect(button.props['aria-label']).toBeDefined();
        expect(typeof button.props['aria-label']).toBe('string');
        expect(button.props['aria-label'].length).toBeGreaterThan(0);
      });
    });

    it('disabled 상태가 올바르게 설정되어야 함', () => {
      const mockProps = {
        currentIndex: 0, // 첫 번째 항목
        totalCount: 1, // 총 1개 (이전/다음 비활성화)
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
      };

      const result = Toolbar(mockProps) as any;
      const leftSection = result.children[0].children[0];
      const prevButton = leftSection.children[0];
      const nextButton = leftSection.children[1];

      expect(prevButton.props.disabled).toBe(true);
      expect(nextButton.props.disabled).toBe(true);
    });
  });

  describe('상태 관리 특성화', () => {
    it('isDownloading 상태가 버튼에 반영되어야 함', () => {
      const mockProps = {
        currentIndex: 0,
        totalCount: 3,
        isDownloading: true,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
      };

      const result = Toolbar(mockProps) as any;
      const rightSection = result.children[0].children[2];

      // 다운로드 버튼 찾기
      const downloadButton = rightSection.children.find((child: any) =>
        child.props?.className?.includes('downloadCurrent')
      );

      expect(downloadButton).toBeDefined();
      expect(downloadButton.props.disabled).toBe(true);
      expect(downloadButton.props['data-loading']).toBe(true);
    });
  });
});
