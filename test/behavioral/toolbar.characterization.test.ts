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
    // 단순 객체 트리 생성을 위한 mock h 구현 (타입 제거로 파서 오류 회피)
    h: function (tag: any, props: any, ...children: any[]) {
      return { tag, props, children } as any;
    },
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

      const findNode = (node: any, predicate: (n: any) => boolean): any | null => {
        if (!node) return null;
        if (predicate(node)) return node;
        if (Array.isArray(node.children)) {
          for (const child of node.children) {
            const found = findNode(child, predicate);
            if (found) return found;
          }
        }
        return null;
      };

      const leftSection = findNode(result, (n: any) =>
        (n.props?.className || '').includes('toolbarLeft')
      );
      expect(leftSection).toBeTruthy();
      const buttonChildren = (leftSection.children || []).filter(
        (c: any) => c && (c.tag === 'button' || typeof c.tag === 'function')
      );
      expect(buttonChildren.length).toBe(2); // previous, next
    });

    it('다운로드 버튼이 존재해야 함', () => {
      const result = Toolbar(mockProps) as any;
      const collectNodes = (node: any, acc: any[] = []): any[] => {
        if (!node) return acc;
        if (Array.isArray(node.children)) {
          node.children.forEach(child => collectNodes(child, acc));
        }
        acc.push(node);
        return acc;
      };
      const all = collectNodes(result, []);
      const downloadButtons = all.filter(n => n.props?.className?.includes('downloadButton'));
      expect(downloadButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('핏 모드 버튼 그룹이 존재해야 함', () => {
      const result = Toolbar(mockProps) as any;
      const findNode = (node: any, predicate: (n: any) => boolean): any | null => {
        if (!node) return null;
        if (predicate(node)) return node;
        if (Array.isArray(node.children)) {
          for (const child of node.children) {
            const found = findNode(child, predicate);
            if (found) return found;
          }
        }
        return null;
      };
      const fitModeGroup = findNode(result, (n: any) =>
        n.props?.className?.includes('fitModeGroup')
      );
      expect(fitModeGroup).toBeTruthy();
      const fitButtons = (fitModeGroup.children || []).filter(
        (c: any) => c && (c.tag === 'button' || typeof c.tag === 'function')
      );
      expect(fitButtons.length).toBe(4);
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
      const findNode = (node: any, predicate: (n: any) => boolean): any | null => {
        if (!node) return null;
        if (predicate(node)) return node;
        if (Array.isArray(node.children)) {
          for (const child of node.children) {
            const found = findNode(child, predicate);
            if (found) return found;
          }
        }
        return null;
      };
      const leftSection = findNode(result, (n: any) =>
        (n.props?.className || '').includes('toolbarLeft')
      );
      const buttons = (leftSection?.children || []).filter(
        (c: any) => c && (c.tag === 'button' || typeof c.tag === 'function')
      );
      const prevButton = buttons[0];
      const nextButton = buttons[1];

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
      const collectNodes = (node: any, acc: any[] = []): any[] => {
        if (!node) return acc;
        if (Array.isArray(node.children)) {
          node.children.forEach(child => collectNodes(child, acc));
        }
        acc.push(node);
        return acc;
      };
      const all = collectNodes(result, []);
      const downloadButton = all.find(n => n.props?.className?.includes('downloadCurrent'));

      expect(downloadButton).toBeDefined();
      expect(downloadButton.props.disabled).toBe(true);
      expect(downloadButton.props['data-loading']).toBe(true);
    });
  });
});
