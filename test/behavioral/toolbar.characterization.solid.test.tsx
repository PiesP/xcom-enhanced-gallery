/** @jsxImportSource solid-js */
/**
 * @fileoverview Toolbar Characterization Tests (Solid)
 * @description Solid 기반 Toolbar의 핵심 행동을 TDD로 문서화
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import { createRoot, type JSX } from 'solid-js';

type ButtonEl = globalThis.HTMLButtonElement;

vi.mock('@shared/services/iconRegistry', () => {
  const icons: Record<string, () => JSX.Element> = {};
  const createIcon = (name: string) => () => (
    <svg data-testid={`icon-${name}`} viewBox='0 0 24 24' role='img' width={24} height={24} />
  );
  const names = [
    'ChevronLeft',
    'ChevronRight',
    'Download',
    'FileZip',
    'Settings',
    'Close',
    'ZoomIn',
    'ArrowAutofitWidth',
    'ArrowAutofitHeight',
    'ArrowsMaximize',
    'Loader2',
  ];
  for (const name of names) {
    icons[name] = createIcon(name);
  }
  return {
    getIconRegistry: () => ({
      loadIcon: (name: string) => Promise.resolve(icons[name]),
      getLoadedIconSync: (name: string) => icons[name] ?? null,
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

vi.mock('@shared/utils', () => ({
  throttleScroll: vi.fn(fn => fn),
}));

vi.mock('@shared/components/ui/StandardProps', () => ({
  ComponentStandards: {
    createClassName: (...classes: string[]) => classes.filter(Boolean).join(' '),
  },
}));

vi.mock('@shared/components/ui/Toolbar/Toolbar.module.css', () => ({
  default: {
    toolbar: 'toolbar',
    toolbarContent: 'toolbarContent',
    toolbarSection: 'toolbarSection',
    toolbarLeft: 'toolbarLeft',
    toolbarCenter: 'toolbarCenter',
    toolbarRight: 'toolbarRight',
    galleryToolbar: 'galleryToolbar',
  },
}));

vi.mock('@shared/components/ui/ToolbarButton/ToolbarButton.module.css', () => ({
  default: {
    toolbarButton: 'toolbarButton',
    'intent-danger': 'intentDanger',
  },
}));

vi.mock('@shared/styles/primitives.module.css', () => ({
  default: {
    controlSurface: 'controlSurface',
  },
}));

import { Toolbar, type ToolbarProps } from '@shared/components/ui/Toolbar/Toolbar';
import { ToolbarHeadless } from '@shared/components/ui/Toolbar/ToolbarHeadless';

const createToolbarProps = (overrides: Partial<ToolbarProps> = {}): ToolbarProps => ({
  currentIndex: 0,
  totalCount: 5,
  isDownloading: false,
  disabled: false,
  currentFitMode: 'fitWidth',
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

const queryToolbarButton = (container: HTMLElement, key: string) =>
  container.querySelector<ButtonEl>(`[data-gallery-element="${key}"]`);

const queryAllToolbarButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<ButtonEl>('[data-toolbar-button="true"]'));

describe('Toolbar Characterization (Solid)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('기본 구조 특성화', () => {
    it('Toolbar와 ToolbarHeadless가 정의되어 있어야 함', () => {
      expect(typeof Toolbar).toBe('function');
      expect(typeof ToolbarHeadless).toBe('function');
    });

    it('핵심 액션 버튼이 모두 렌더링되어야 함', () => {
      const props = createToolbarProps();
      const { container } = render(() => <Toolbar {...props} />);

      const keys = [
        'nav-previous',
        'nav-next',
        'fit-original',
        'fit-width',
        'fit-height',
        'fit-container',
        'download-current',
        'download-all',
        'settings',
        'close',
      ];

      keys.forEach(key => {
        expect(queryToolbarButton(container, key)).toBeTruthy();
      });
    });

    it('미디어 카운터가 현재 인덱스와 총 개수를 표시해야 함', () => {
      const props = createToolbarProps({ currentIndex: 2, totalCount: 7 });
      const { container } = render(() => <Toolbar {...props} />);
      const counter = container.querySelector('[data-gallery-element="counter-section"]');
      expect(counter).toBeTruthy();
      expect(counter?.textContent ?? '').toContain('3');
      expect(counter?.textContent ?? '').toContain('7');
    });
  });

  describe('접근성 특성화', () => {
    it('모든 버튼에 aria-label이 존재해야 함', () => {
      const props = createToolbarProps();
      const { container } = render(() => <Toolbar {...props} />);
      const buttons = queryAllToolbarButtons(container);
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        const label = button.getAttribute('aria-label');
        expect(label).toBeTruthy();
        expect((label ?? '').length).toBeGreaterThan(0);
      });
    });

    it('첫 번째 항목에서는 이전 버튼이 비활성화되어야 함', () => {
      const props = createToolbarProps({ currentIndex: 0 });
      const { container } = render(() => <Toolbar {...props} />);
      const previous = queryToolbarButton(container, 'nav-previous');
      const next = queryToolbarButton(container, 'nav-next');
      expect(previous?.disabled).toBe(true);
      expect(next?.disabled).toBe(false);
    });

    it('마지막 항목에서는 다음 버튼이 비활성화되어야 함', () => {
      const props = createToolbarProps({ currentIndex: 4, totalCount: 5 });
      const { container } = render(() => <Toolbar {...props} />);
      const previous = queryToolbarButton(container, 'nav-previous');
      const next = queryToolbarButton(container, 'nav-next');
      expect(previous?.disabled).toBe(false);
      expect(next?.disabled).toBe(true);
    });
  });

  describe('상태 관리 특성화', () => {
    it('다운로드 진행 상태가 버튼에 반영되어야 함', () => {
      const props = createToolbarProps({ isDownloading: true });
      const { container } = render(() => <Toolbar {...props} />);
      const currentDownload = queryToolbarButton(container, 'download-current');
      expect(currentDownload?.getAttribute('data-loading')).toBe('true');
      expect(currentDownload?.disabled).toBe(true);
    });

    it('핏 모드 선택 상태가 currentFitMode에 따라 결정되어야 함', () => {
      const props = createToolbarProps({ currentFitMode: 'fitHeight' });
      const { container } = render(() => <Toolbar {...props} />);
      const fitHeight = queryToolbarButton(container, 'fit-height');
      const fitWidth = queryToolbarButton(container, 'fit-width');
      expect(fitHeight?.getAttribute('data-selected')).toBe('true');
      expect(fitWidth?.getAttribute('data-selected')).toBeNull();
    });

    it('버튼 클릭 시 해당 핸들러가 호출되어야 함', () => {
      const onPrevious = vi.fn();
      const onDownloadCurrent = vi.fn();
      const props = createToolbarProps({
        currentIndex: 1,
        onPrevious,
        onDownloadCurrent,
      });
      const { container } = render(() => <Toolbar {...props} />);
      const prev = queryToolbarButton(container, 'nav-previous');
      const download = queryToolbarButton(container, 'download-current');

      prev?.click();
      download?.click();

      expect(onPrevious).toHaveBeenCalledTimes(1);
      expect(onDownloadCurrent).toHaveBeenCalledTimes(1);
    });
  });

  describe('Headless 상태 매핑', () => {
    it('ToolbarHeadless가 children 콜백에 상태와 액션을 전달해야 함', () => {
      const props = createToolbarProps();
      let receivedState: unknown;
      let receivedActions: unknown;

      createRoot(dispose => {
        ToolbarHeadless({
          ...props,
          children: (state, actions) => {
            receivedState = state;
            receivedActions = actions;
            return null;
          },
        });
        dispose();
      });

      expect(receivedState).toBeDefined();
      expect(receivedActions).toBeDefined();
      expect((receivedState as { items?: unknown[] })?.items?.length ?? 0).toBeGreaterThan(0);
      expect(typeof (receivedActions as { setMode?: unknown })?.setMode).toBe('function');
    });
  });
});
