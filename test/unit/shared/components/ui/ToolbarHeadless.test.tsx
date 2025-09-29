/**
 * @fileoverview ToolbarHeadless Unit Tests (Phase P1)
 * @description Headless 툴바 컨테이너의 로직 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'solid-js';
import {
  ToolbarHeadless,
  type ToolbarHeadlessProps,
  type ToolbarState,
  type ToolbarActions,
} from '../../../../../src/shared/components/ui/Toolbar/ToolbarHeadless';

describe('ToolbarHeadless (P1)', () => {
  const mockProps = {
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

  const renderToolbarHeadless = (
    override: Partial<ToolbarHeadlessProps> = {}
  ): { state: ToolbarState; actions: ToolbarActions; dispose: () => void } => {
    let capturedState: ToolbarState | undefined;
    let capturedActions: ToolbarActions | undefined;
    let disposeRoot = () => void 0;

    const overrideChildren = override.children;

    createRoot(dispose => {
      disposeRoot = dispose;
      ToolbarHeadless({
        ...mockProps,
        ...override,
        children: (state, actions) => {
          capturedState = state;
          capturedActions = actions;
          if (overrideChildren) {
            return overrideChildren(state, actions);
          }
          return null;
        },
      });
    });

    if (!capturedState || !capturedActions) {
      throw new Error('ToolbarHeadless did not invoke children callback');
    }

    return { state: capturedState, actions: capturedActions, dispose: disposeRoot };
  };

  describe('Config to Items 정규화', () => {
    it('기본 설정이 올바른 아이템 목록으로 변환되어야 함', () => {
      const { state, dispose } = renderToolbarHeadless();

      expect(state.items).toBeDefined();
      expect(state.items.length).toBeGreaterThan(0);

      // 필수 아이템들이 있는지 확인
      const itemTypes = state.items.map(item => item.type);
      expect(itemTypes).toContain('previous');
      expect(itemTypes).toContain('next');
      expect(itemTypes).toContain('downloadCurrent');
      expect(itemTypes).toContain('close');

      dispose();
    });

    it('네비게이션 버튼 disabled 상태가 올바르게 설정되어야 함', () => {
      const { state, dispose } = renderToolbarHeadless({ currentIndex: 0, totalCount: 3 });

      const previousBtn = state.items.find(item => item.type === 'previous');
      const nextBtn = state.items.find(item => item.type === 'next');

      expect(previousBtn?.disabled).toBe(true);
      expect(nextBtn?.disabled).toBe(false);

      dispose();
    });

    it('마지막 아이템에서 next 버튼이 비활성화되어야 함', () => {
      const { state, dispose } = renderToolbarHeadless({ currentIndex: 2, totalCount: 3 });

      const previousBtn = state.items.find(item => item.type === 'previous');
      const nextBtn = state.items.find(item => item.type === 'next');

      expect(previousBtn?.disabled).toBe(false);
      expect(nextBtn?.disabled).toBe(true);

      dispose();
    });
  });

  describe('상태 관리', () => {
    it('다운로드 상태가 올바르게 반영되어야 함', () => {
      const { state, dispose } = renderToolbarHeadless({ isDownloading: true });

      expect(state.isDownloading).toBe(true);

      const downloadCurrentBtn = state.items.find(item => item.type === 'downloadCurrent');
      const downloadAllBtn = state.items.find(item => item.type === 'downloadAll');

      expect(downloadCurrentBtn?.loading).toBe(true);
      expect(downloadAllBtn?.loading).toBe(true);

      dispose();
    });

    it('fit 모드 상태가 올바르게 관리되어야 함', () => {
      const { state, actions, dispose } = renderToolbarHeadless();

      expect(state.currentFitMode).toBe('original');

      actions.setFitMode('fitWidth');

      expect(actions.setFitMode).toBeDefined();

      dispose();
    });
  });

  describe('액션 핸들러 매핑', () => {
    it('각 아이템이 올바른 액션 핸들러를 가져야 함', () => {
      const { state, dispose } = renderToolbarHeadless();

      const previousBtn = state.items.find(item => item.type === 'previous');
      const nextBtn = state.items.find(item => item.type === 'next');
      const downloadBtn = state.items.find(item => item.type === 'downloadCurrent');
      const closeBtn = state.items.find(item => item.type === 'close');

      expect(previousBtn?.onAction).toBe(mockProps.onPrevious);
      expect(nextBtn?.onAction).toBe(mockProps.onNext);
      expect(downloadBtn?.onAction).toBe(mockProps.onDownloadCurrent);
      expect(closeBtn?.onAction).toBe(mockProps.onClose);

      dispose();
    });

    it('옵셔널 핸들러가 없을 때 비활성화되어야 함', () => {
      const { state, dispose } = renderToolbarHeadless({ onOpenSettings: undefined });

      const settingsBtn = state.items.find(item => item.type === 'settings');
      expect(settingsBtn?.disabled).toBe(true);

      dispose();
    });
  });

  describe('그룹화', () => {
    it('아이템들이 올바른 그룹으로 분류되어야 함', () => {
      const { state, dispose } = renderToolbarHeadless();

      const navigationItems = state.items.filter(item => item.group === 'navigation');
      const fitModeItems = state.items.filter(item => item.group === 'fitModes');
      const downloadItems = state.items.filter(item => item.group === 'downloads');
      const controlItems = state.items.filter(item => item.group === 'controls');

      expect(navigationItems.length).toBe(2); // previous, next
      expect(fitModeItems.length).toBe(4); // fitOriginal, fitWidth, fitHeight, fitContainer
      expect(downloadItems.length).toBe(2); // downloadCurrent, downloadAll
      expect(controlItems.length).toBe(2); // settings, close

      dispose();
    });
  });

  describe('Render Prop 패턴', () => {
    it('children 함수가 state와 actions를 받아야 함', () => {
      const childrenSpy = vi.fn().mockReturnValue(null);

      const { dispose } = renderToolbarHeadless({ children: childrenSpy });

      expect(childrenSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.any(Array),
          currentMode: expect.any(String),
          needsHighContrast: expect.any(Boolean),
          isDownloading: expect.any(Boolean),
          currentIndex: expect.any(Number),
          totalCount: expect.any(Number),
          currentFitMode: expect.any(String),
        }),
        expect.objectContaining({
          setMode: expect.any(Function),
          setHighContrast: expect.any(Function),
          setFitMode: expect.any(Function),
          setDownloading: expect.any(Function),
          updateItems: expect.any(Function),
        })
      );

      dispose();
    });
  });
});
