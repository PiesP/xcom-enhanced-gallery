/**
 * @fileoverview ToolbarHeadless Component Tests
 * @description 툴바 렌더링 및 상태 관리 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, h } from '@test/utils/testing-library';
import {
  ToolbarHeadless,
  type ToolbarState,
  type ToolbarActions,
  type ToolbarHeadlessProps,
} from '../../../../../src/shared/components/ui/Toolbar/ToolbarHeadless';

describe('ToolbarHeadless (P1)', () => {
  const defaultProps: Omit<ToolbarHeadlessProps, 'children'> = {
    currentIndex: 0,
    totalCount: 3,
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Config to Items 정규화', () => {
    it('기본 설정이 올바른 아이템 목록으로 변환되어야 함', () => {
      let capturedState: ToolbarState | null = null;

      const TestChild = (state: ToolbarState) => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      render(h(ToolbarHeadless, { ...defaultProps, children: TestChild }));

      expect(capturedState).not.toBeNull();
      const state = capturedState!;

      expect(state.items).toBeDefined();
      // items는 Accessor이므로 호출해야 함
      const items = state.items();
      expect(items.length).toBeGreaterThan(0);

      // 필수 아이템들이 있는지 확인
      const itemTypes = items.map(item => item.type);
      expect(itemTypes).toContain('previous');
      expect(itemTypes).toContain('next');
      expect(itemTypes).toContain('downloadCurrent');
      expect(itemTypes).toContain('close');
    });

    it('네비게이션 버튼 disabled 상태가 올바르게 설정되어야 함', () => {
      let capturedState: ToolbarState | null = null;

      const TestChild = (state: ToolbarState) => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      // 첫 번째 아이템 테스트 (previous 비활성화)
      render(
        h(ToolbarHeadless, {
          ...defaultProps,
          currentIndex: 0,
          totalCount: 3,
          children: TestChild,
        })
      );

      expect(capturedState).not.toBeNull();
      const state = capturedState!;

      const items = state.items();
      const previousBtn = items.find(item => item.type === 'previous');
      const nextBtn = items.find(item => item.type === 'next');

      expect(previousBtn?.disabled).toBe(true);
      expect(nextBtn?.disabled).toBe(false);
    });

    it('마지막 아이템에서 next 버튼이 비활성화되어야 함', () => {
      let capturedState: ToolbarState | null = null;

      const TestChild = (state: ToolbarState) => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      // 마지막 아이템 테스트
      render(
        h(ToolbarHeadless, {
          ...defaultProps,
          currentIndex: 2,
          totalCount: 3,
          children: TestChild,
        })
      );

      expect(capturedState).not.toBeNull();
      const state = capturedState!;

      const items = state.items();
      const previousBtn = items.find(item => item.type === 'previous');
      const nextBtn = items.find(item => item.type === 'next');

      expect(previousBtn?.disabled).toBe(false);
      expect(nextBtn?.disabled).toBe(true);
    });
  });

  describe('상태 관리', () => {
    it('다운로드 상태가 올바르게 반영되어야 함', () => {
      let capturedState: ToolbarState | null = null;

      const TestChild = (state: ToolbarState) => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      render(
        h(ToolbarHeadless, {
          ...defaultProps,
          isDownloading: true,
          children: TestChild,
        })
      );

      expect(capturedState).not.toBeNull();
      const state = capturedState!;

      expect(state.isDownloading()).toBe(true);

      const items = state.items();
      const downloadCurrentBtn = items.find(item => item.type === 'downloadCurrent');
      const downloadAllBtn = items.find(item => item.type === 'downloadAll');

      expect(downloadCurrentBtn?.loading).toBe(true);
      expect(downloadAllBtn?.loading).toBe(true);
    });

    it('fit 모드 상태가 올바르게 관리되어야 함', () => {
      let capturedState: ToolbarState | null = null;
      let capturedActions: ToolbarActions | null = null;

      const TestChild = (state: ToolbarState, actions: ToolbarActions) => {
        capturedState = state;
        capturedActions = actions;
        return h('div', {}, 'test');
      };

      render(h(ToolbarHeadless, { ...defaultProps, children: TestChild }));

      expect(capturedState).not.toBeNull();
      expect(capturedActions).not.toBeNull();

      const state = capturedState!;
      const actions = capturedActions!;

      // 초기 상태 확인
      expect(state.currentFitMode()).toBe('original');

      // fit 모드 변경
      actions.setFitMode('fitWidth');

      // 상태가 업데이트되었는지 확인
      expect(state.currentFitMode()).toBe('fitWidth');
      expect(actions.setFitMode).toBeDefined();
    });
  });

  describe('액션 핸들러 매핑', () => {
    it('각 아이템이 올바른 액션 핸들러를 가져야 함', () => {
      let capturedState: ToolbarState | null = null;

      const TestChild = (state: ToolbarState) => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      render(h(ToolbarHeadless, { ...defaultProps, children: TestChild }));

      expect(capturedState).not.toBeNull();
      const state = capturedState!;

      // 액션 핸들러 매핑 확인
      const items = state.items();
      const previousBtn = items.find(item => item.type === 'previous');
      const nextBtn = items.find(item => item.type === 'next');
      const downloadBtn = items.find(item => item.type === 'downloadCurrent');
      const closeBtn = items.find(item => item.type === 'close');

      expect(previousBtn?.onAction).toBe(defaultProps.onPrevious);
      expect(nextBtn?.onAction).toBe(defaultProps.onNext);
      expect(downloadBtn?.onAction).toBe(defaultProps.onDownloadCurrent);
      expect(closeBtn?.onAction).toBe(defaultProps.onClose);
    });

    it('옵셔널 핸들러가 없을 때 비활성화되어야 함', () => {
      let capturedState: ToolbarState | null = null;

      const TestChild = (state: ToolbarState) => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      const propsWithoutSettings = {
        ...defaultProps,
        onOpenSettings: undefined,
      };

      render(h(ToolbarHeadless, { ...propsWithoutSettings, children: TestChild }));

      expect(capturedState).not.toBeNull();
      const state = capturedState!;

      const settingsBtn = state.items().find(item => item.type === 'settings');
      expect(settingsBtn?.disabled).toBe(true);
    });
  });

  describe('그룹화', () => {
    it('아이템들이 올바른 그룹으로 분류되어야 함', () => {
      let capturedState: ToolbarState | null = null;

      const TestChild = (state: ToolbarState) => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      render(h(ToolbarHeadless, { ...defaultProps, children: TestChild }));

      expect(capturedState).not.toBeNull();
      const state = capturedState!;

      const items = state.items();
      const navigationItems = items.filter(item => item.group === 'navigation');
      const fitModeItems = items.filter(item => item.group === 'fitModes');
      const downloadItems = items.filter(item => item.group === 'downloads');
      const controlItems = items.filter(item => item.group === 'controls');

      expect(navigationItems.length).toBe(2); // previous, next
      expect(fitModeItems.length).toBe(4); // fitOriginal, fitWidth, fitHeight, fitContainer
      expect(downloadItems.length).toBe(2); // downloadCurrent, downloadAll
      expect(controlItems.length).toBe(2); // settings, close
    });
  });

  describe('Render Prop 패턴', () => {
    it('children 함수가 state와 actions를 받아야 함', () => {
      const childrenSpy = vi
        .fn<(state: ToolbarState, actions: ToolbarActions) => ReturnType<typeof h>>()
        .mockReturnValue(h('div', {}, 'test'));

      render(h(ToolbarHeadless, { ...defaultProps, children: childrenSpy }));

      expect(childrenSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.any(Function),
          currentMode: expect.any(Function),
          needsHighContrast: expect.any(Function),
          isDownloading: expect.any(Function),
          currentIndex: expect.any(Function),
          totalCount: expect.any(Function),
          currentFitMode: expect.any(Function),
        }),
        expect.objectContaining({
          setMode: expect.any(Function),
          setHighContrast: expect.any(Function),
          setFitMode: expect.any(Function),
          setDownloading: expect.any(Function),
          updateItems: expect.any(Function),
        })
      );
    });
  });
});
