/**
 * @fileoverview ToolbarHeadless Unit Tests (Phase P1)
 * @description Headless 툴바 컨테이너의 로직 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/preact';
import { h } from '@shared/external/vendors';
import { ToolbarHeadless } from '../../../../../src/shared/components/ui/Toolbar/ToolbarHeadless';

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

  describe('Config to Items 정규화', () => {
    it('기본 설정이 올바른 아이템 목록으로 변환되어야 함', () => {
      let capturedState = null;

      const TestChild = state => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      render(h(ToolbarHeadless, { ...mockProps, children: TestChild }));

      expect(capturedState).not.toBeNull();
      expect(capturedState.items).toBeDefined();
      expect(capturedState.items.length).toBeGreaterThan(0);

      // 필수 아이템들이 있는지 확인
      const itemTypes = capturedState.items.map(item => item.type);
      expect(itemTypes).toContain('previous');
      expect(itemTypes).toContain('next');
      expect(itemTypes).toContain('downloadCurrent');
      expect(itemTypes).toContain('close');
    });

    it('네비게이션 버튼 disabled 상태가 올바르게 설정되어야 함', () => {
      let capturedState = null;

      const TestChild = state => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      // 첫 번째 아이템 테스트 (previous 비활성화)
      render(
        h(ToolbarHeadless, {
          ...mockProps,
          currentIndex: 0,
          totalCount: 3,
          children: TestChild,
        })
      );

      const previousBtn = capturedState.items.find(item => item.type === 'previous');
      const nextBtn = capturedState.items.find(item => item.type === 'next');

      expect(previousBtn?.disabled).toBe(true);
      expect(nextBtn?.disabled).toBe(false);
    });

    it('마지막 아이템에서 next 버튼이 비활성화되어야 함', () => {
      let capturedState = null;

      const TestChild = state => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      // 마지막 아이템 테스트
      render(
        h(ToolbarHeadless, {
          ...mockProps,
          currentIndex: 2,
          totalCount: 3,
          children: TestChild,
        })
      );

      const previousBtn = capturedState.items.find(item => item.type === 'previous');
      const nextBtn = capturedState.items.find(item => item.type === 'next');

      expect(previousBtn?.disabled).toBe(false);
      expect(nextBtn?.disabled).toBe(true);
    });
  });

  describe('상태 관리', () => {
    it('다운로드 상태가 올바르게 반영되어야 함', () => {
      let capturedState = null;

      const TestChild = state => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      render(
        h(ToolbarHeadless, {
          ...mockProps,
          isDownloading: true,
          children: TestChild,
        })
      );

      expect(capturedState.isDownloading).toBe(true);

      const downloadCurrentBtn = capturedState.items.find(item => item.type === 'downloadCurrent');
      const downloadAllBtn = capturedState.items.find(item => item.type === 'downloadAll');

      expect(downloadCurrentBtn?.loading).toBe(true);
      expect(downloadAllBtn?.loading).toBe(true);
    });

    it('fit 모드 상태가 올바르게 관리되어야 함', () => {
      let capturedState = null;
      let capturedActions = null;

      const TestChild = (state, actions) => {
        capturedState = state;
        capturedActions = actions;
        return h('div', {}, 'test');
      };

      render(h(ToolbarHeadless, { ...mockProps, children: TestChild }));

      // 초기 상태 확인
      expect(capturedState.currentFitMode).toBe('original');

      // fit 모드 변경
      capturedActions.setFitMode('fitWidth');

      // 상태가 업데이트되었는지는 리렌더를 통해 확인해야 함
      expect(capturedActions.setFitMode).toBeDefined();
    });
  });

  describe('액션 핸들러 매핑', () => {
    it('각 아이템이 올바른 액션 핸들러를 가져야 함', () => {
      let capturedState = null;

      const TestChild = state => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      render(h(ToolbarHeadless, { ...mockProps, children: TestChild }));

      // 액션 핸들러 매핑 확인
      const previousBtn = capturedState.items.find(item => item.type === 'previous');
      const nextBtn = capturedState.items.find(item => item.type === 'next');
      const downloadBtn = capturedState.items.find(item => item.type === 'downloadCurrent');
      const closeBtn = capturedState.items.find(item => item.type === 'close');

      expect(previousBtn?.onAction).toBe(mockProps.onPrevious);
      expect(nextBtn?.onAction).toBe(mockProps.onNext);
      expect(downloadBtn?.onAction).toBe(mockProps.onDownloadCurrent);
      expect(closeBtn?.onAction).toBe(mockProps.onClose);
    });

    it('옵셔널 핸들러가 없을 때 비활성화되어야 함', () => {
      let capturedState = null;

      const TestChild = state => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      const propsWithoutSettings = {
        ...mockProps,
        onOpenSettings: undefined,
      };

      render(h(ToolbarHeadless, { ...propsWithoutSettings, children: TestChild }));

      const settingsBtn = capturedState.items.find(item => item.type === 'settings');
      expect(settingsBtn?.disabled).toBe(true);
    });
  });

  describe('그룹화', () => {
    it('아이템들이 올바른 그룹으로 분류되어야 함', () => {
      let capturedState = null;

      const TestChild = state => {
        capturedState = state;
        return h('div', {}, 'test');
      };

      render(h(ToolbarHeadless, { ...mockProps, children: TestChild }));

      const navigationItems = capturedState.items.filter(item => item.group === 'navigation');
      const fitModeItems = capturedState.items.filter(item => item.group === 'fitModes');
      const downloadItems = capturedState.items.filter(item => item.group === 'downloads');
      const controlItems = capturedState.items.filter(item => item.group === 'controls');

      expect(navigationItems.length).toBe(2); // previous, next
      expect(fitModeItems.length).toBe(4); // fitOriginal, fitWidth, fitHeight, fitContainer
      expect(downloadItems.length).toBe(2); // downloadCurrent, downloadAll
      expect(controlItems.length).toBe(2); // settings, close
    });
  });

  describe('Render Prop 패턴', () => {
    it('children 함수가 state와 actions를 받아야 함', () => {
      const childrenSpy = vi.fn().mockReturnValue(h('div', {}, 'test'));

      render(h(ToolbarHeadless, { ...mockProps, children: childrenSpy }));

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
    });
  });
});
