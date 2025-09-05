/**
 * @fileoverview Toolbar Characterization Tests (TDD Phase P0)
 * @description 현재 툴바 구현의 기본 특성을 테스트로 문서화
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/preact';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { ToolbarHeadless } from '@shared/components/ui/Toolbar/ToolbarHeadless';
import { getPreact } from '@shared/external/vendors';

// Mock external dependencies
vi.mock('@shared/external/vendors', () => ({
  getPreact: () => ({
    // 실제 DOM 구조와 유사한 mock h 구현
    h: function (tag, props, ...children) {
      const flatChildren = children.flat().filter(Boolean);

      // Function component 처리
      if (typeof tag === 'function') {
        try {
          return tag(props || {});
        } catch (error) {
          return { tag: 'div', props: { 'data-mock-error': error.message }, children: [] };
        }
      }

      return {
        tag,
        props: { ...props, key: props?.key || Math.random() },
        children: flatChildren,
      };
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

// CSS 모듈 mock
vi.mock('@shared/components/ui/Toolbar/Toolbar.module.css', () => ({
  default: {
    toolbar: 'toolbar',
    toolbarSection: 'toolbarSection',
    toolbarLeft: 'toolbarLeft',
    toolbarButton: 'toolbarButton',
    downloadButton: 'downloadButton',
    downloadCurrent: 'downloadCurrent',
    downloadAll: 'downloadAll',
    fitModeGroup: 'fitModeGroup',
    galleryToolbar: 'galleryToolbar',
  },
}));

// Icon 컴포넌트들 mock
vi.mock('@shared/components/ui/Icon', () => ({
  ChevronLeft: () => ({ tag: 'svg', props: { 'data-icon': 'chevron-left' }, children: [] }),
  ChevronRight: () => ({ tag: 'svg', props: { 'data-icon': 'chevron-right' }, children: [] }),
  Download: () => ({ tag: 'svg', props: { 'data-icon': 'download' }, children: [] }),
  FileZip: () => ({ tag: 'svg', props: { 'data-icon': 'file-zip' }, children: [] }),
  Settings: () => ({ tag: 'svg', props: { 'data-icon': 'settings' }, children: [] }),
  X: () => ({ tag: 'svg', props: { 'data-icon': 'x' }, children: [] }),
  ZoomIn: () => ({ tag: 'svg', props: { 'data-icon': 'zoom-in' }, children: [] }),
  ArrowAutofitWidth: () => ({
    tag: 'svg',
    props: { 'data-icon': 'arrow-autofit-width' },
    children: [],
  }),
  ArrowAutofitHeight: () => ({
    tag: 'svg',
    props: { 'data-icon': 'arrow-autofit-height' },
    children: [],
  }),
  ArrowsMaximize: () => ({ tag: 'svg', props: { 'data-icon': 'arrows-maximize' }, children: [] }),
  Loader2: () => ({ tag: 'svg', props: { 'data-icon': 'loader2' }, children: [] }),
}));

// Standard Props mock
vi.mock('@shared/components/ui/StandardProps', () => ({
  ComponentStandards: {
    createClassName: (...classNames) => classNames.filter(Boolean).join(' '),
  },
}));

// Utils mock
vi.mock('@shared/utils', () => ({
  throttleScroll: vi.fn(fn => fn),
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
    createClassName: (...classes) => classes.filter(Boolean).join(' '),
  },
}));

// IconButton mock
vi.mock('@shared/components/ui/primitive/IconButton', () => ({
  IconButton: ({ children, ...props }) => ({ tag: 'button', props, children: [children] }),
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
      const { h } = getPreact();

      // h 함수로 직접 렌더링 시도
      const result = h(Toolbar, mockProps);

      // 기본 검증
      expect(result).toBeTruthy();
      expect(result.tag).toBeDefined();
    });

    it('네비게이션 버튼들이 존재해야 함', () => {
      const { h } = getPreact();
      const result = h(Toolbar, mockProps);

      // 개선된 버튼 탐지 로직
      const collectElements = (node, predicate) => {
        const results = [];
        if (!node) return results;

        if (predicate(node)) results.push(node);

        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(child => {
            results.push(...collectElements(child, predicate));
          });
        }

        return results;
      };

      // 버튼 요소 수집 (button 태그 또는 IconButton 컴포넌트)
      const buttons = collectElements(
        result,
        node =>
          node?.tag === 'button' ||
          (typeof node?.tag === 'function' && node?.tag?.name === 'IconButton')
      );

      // 네비게이션 버튼들이 포함된 최소 버튼 개수 확인
      expect(buttons.length).toBeGreaterThanOrEqual(6); // prev, next, download, 4 fit modes
    });

    it('다운로드 버튼이 존재해야 함', () => {
      const { h } = getPreact();
      const result = h(Toolbar, mockProps);

      // 개선된 요소 수집 함수
      const collectElements = (node, predicate) => {
        const results = [];
        if (!node) return results;

        if (predicate(node)) results.push(node);

        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(child => {
            results.push(...collectElements(child, predicate));
          });
        }

        return results;
      };

      const buttons = collectElements(
        result,
        node =>
          node?.tag === 'button' ||
          (typeof node?.tag === 'function' && node?.tag?.name === 'IconButton')
      );

      // aria-label로 다운로드 관련 버튼 검증
      const downloadButtons = buttons.filter(
        btn =>
          btn.props?.['aria-label']?.includes('다운로드') ||
          btn.props?.title?.includes('다운로드') ||
          btn.props?.className?.includes('downloadButton')
      );

      expect(downloadButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('핏 모드 버튼 그룹이 존재해야 함', () => {
      const { h } = getPreact();
      const result = h(Toolbar, mockProps);

      // 개선된 요소 수집 함수
      const collectElements = (node, predicate) => {
        const results = [];
        if (!node) return results;

        if (predicate(node)) results.push(node);

        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(child => {
            results.push(...collectElements(child, predicate));
          });
        }

        return results;
      };

      const buttons = collectElements(
        result,
        node =>
          node?.tag === 'button' ||
          (typeof node?.tag === 'function' && node?.tag?.name === 'IconButton')
      );

      // aria-label로 핏 모드 관련 버튼들 검증
      const fitButtons = buttons.filter(
        btn =>
          btn.props?.['aria-label']?.includes('원본') ||
          btn.props?.['aria-label']?.includes('맞춤') ||
          btn.props?.title?.includes('맞춤') ||
          btn.props?.className?.includes('fitButton')
      );

      expect(fitButtons.length).toBeGreaterThanOrEqual(4); // 4개 핏 모드
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

      const { h } = getPreact();
      const result = h(Toolbar, mockProps);

      // 개선된 요소 수집 함수
      const collectElements = (node, predicate) => {
        const results = [];
        if (!node) return results;

        if (predicate(node)) results.push(node);

        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(child => {
            results.push(...collectElements(child, predicate));
          });
        }

        return results;
      };

      const buttons = collectElements(
        result,
        node =>
          node?.tag === 'button' ||
          (typeof node?.tag === 'function' && node?.tag?.name === 'IconButton')
      );

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

      const { h } = getPreact();
      const result = h(Toolbar, mockProps);

      // 개선된 요소 수집 함수
      const collectElements = (node, predicate) => {
        const results = [];
        if (!node) return results;

        if (predicate(node)) results.push(node);

        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(child => {
            results.push(...collectElements(child, predicate));
          });
        }

        return results;
      };

      const buttons = collectElements(
        result,
        node =>
          node?.tag === 'button' ||
          (typeof node?.tag === 'function' && node?.tag?.name === 'IconButton')
      );

      expect(buttons.length).toBeGreaterThanOrEqual(2);

      // 네비게이션 버튼들이 disabled 되어 있는지 확인
      const navButtons = buttons.filter(
        btn =>
          btn.props?.['aria-label']?.includes('이전') || btn.props?.['aria-label']?.includes('다음')
      );

      expect(navButtons.length).toBeGreaterThanOrEqual(2);
      navButtons.forEach(btn => {
        expect(btn.props?.disabled).toBe(true);
      });
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

      const { h } = getPreact();
      const result = h(Toolbar, mockProps);

      // 개선된 요소 수집 함수
      const collectElements = (node, predicate) => {
        const results = [];
        if (!node) return results;

        if (predicate(node)) results.push(node);

        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(child => {
            results.push(...collectElements(child, predicate));
          });
        }

        return results;
      };

      const buttons = collectElements(
        result,
        node =>
          node?.tag === 'button' ||
          (typeof node?.tag === 'function' && node?.tag?.name === 'IconButton')
      );

      const downloadButtons = buttons.filter(
        btn =>
          btn.props?.['aria-label']?.includes('다운로드') ||
          btn.props?.className?.includes('downloadButton')
      );

      expect(downloadButtons.length).toBeGreaterThanOrEqual(1);

      // isDownloading=true일 때 다운로드 버튼이 disabled되어야 함
      downloadButtons.forEach(btn => {
        expect(btn.props?.disabled).toBe(true);
      });
    });
  });
});
