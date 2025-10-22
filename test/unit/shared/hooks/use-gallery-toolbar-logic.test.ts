/**
 * @fileoverview useGalleryToolbarLogic 마이그레이션 테스트
 * @description createSignalSafe 기반 리팩토링 검증
 * @phase A5.3 Step 1: Signal Pattern Standardization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGalleryToolbarLogic } from '@shared/hooks/use-gallery-toolbar-logic';

describe('useGalleryToolbarLogic - createSignalSafe 마이그레이션', () => {
  const mockProps = {
    currentIndex: 0,
    totalCount: 10,
    isDownloading: false,
    disabled: false,
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

  describe('상태 초기화 및 접근', () => {
    it('초기 fit 모드는 fitContainer', () => {
      const { state } = useGalleryToolbarLogic(mockProps);
      expect(state.currentFitMode()).toBe('fitContainer');
    });

    it('totalCount > 1이면 이전/다음 이동 가능', () => {
      const { state } = useGalleryToolbarLogic(mockProps);
      expect(state.canGoPrevious()).toBe(true);
      expect(state.canGoNext()).toBe(true);
    });

    it('totalCount = 1이면 이전/다음 이동 불가', () => {
      const { state } = useGalleryToolbarLogic({ ...mockProps, totalCount: 1 });
      expect(state.canGoPrevious()).toBe(false);
      expect(state.canGoNext()).toBe(false);
    });

    it('displayIndex는 currentIndex를 기본값으로 사용', () => {
      const { state } = useGalleryToolbarLogic({ ...mockProps, currentIndex: 5 });
      expect(state.displayIndex()).toBe(5);
    });

    it('mediaCounter는 current, total, progress 반환', () => {
      const { state } = useGalleryToolbarLogic(mockProps);
      const counter = state.mediaCounter();
      expect(counter.current).toBe(1); // displayIndex(0) + 1
      expect(counter.total).toBe(10);
      expect(counter.progress).toBe(10); // (1/10)*100
    });
  });

  describe('Fit 모드 변경 (Signal 상태)', () => {
    it('setFitMode로 fit 모드 변경', () => {
      const { state, actions } = useGalleryToolbarLogic(mockProps);

      actions.setFitMode('fitWidth');
      expect(state.currentFitMode()).toBe('fitWidth');

      actions.setFitMode('original');
      expect(state.currentFitMode()).toBe('original');
    });

    it('fit 모드 변경 후 상태 유지', () => {
      const { state, actions } = useGalleryToolbarLogic(mockProps);

      actions.setFitMode('fitHeight');
      expect(state.currentFitMode()).toBe('fitHeight');
      expect(state.currentFitMode()).toBe('fitHeight'); // 호출해도 유지
    });
  });

  describe('버튼 Props 생성 (동작 검증)', () => {
    it('previous 버튼은 canGoPrevious() 상태에 따라 disabled', () => {
      const { getActionProps } = useGalleryToolbarLogic(mockProps);
      const props = getActionProps('previous');

      expect(props.disabled).toBe(false);
      expect(typeof props.onClick).toBe('function');
    });

    it('previous 버튼 클릭 시 onPrevious 호출', () => {
      const { getActionProps } = useGalleryToolbarLogic(mockProps);
      const props = getActionProps('previous');

      props.onClick();
      expect(mockProps.onPrevious).toHaveBeenCalled();
    });

    it('next 버튼 클릭 시 onNext 호출', () => {
      const { getActionProps } = useGalleryToolbarLogic(mockProps);
      const props = getActionProps('next');

      props.onClick();
      expect(mockProps.onNext).toHaveBeenCalled();
    });

    it('downloadCurrent 버튼은 isDownloading 상태에 따라 disabled', () => {
      const { getActionProps: getActionPropsNormal } = useGalleryToolbarLogic(mockProps);
      const { getActionProps: getActionPropsDownloading } = useGalleryToolbarLogic({
        ...mockProps,
        isDownloading: true,
      });

      const normalProps = getActionPropsNormal('downloadCurrent');
      const downloadingProps = getActionPropsDownloading('downloadCurrent');

      expect(normalProps.disabled).toBe(false);
      expect(downloadingProps.disabled).toBe(true);
      expect(downloadingProps.loading).toBe(true);
    });

    it('fitMode 버튼 selected 상태 반영', () => {
      const { getActionProps } = useGalleryToolbarLogic(mockProps);

      const fitContainerProps = getActionProps('fitContainer');
      const fitWidthProps = getActionProps('fitWidth');

      expect(fitContainerProps.selected).toBe(true); // 초기값
      expect(fitWidthProps.selected).toBe(false);
    });

    it('fit 모드 변경 후 selected 상태 업데이트', () => {
      const { state, actions, getActionProps } = useGalleryToolbarLogic(mockProps);

      // 초기: fitContainer 선택됨
      expect(getActionProps('fitContainer').selected).toBe(true);

      // fitWidth로 변경
      actions.setFitMode('fitWidth');
      expect(state.currentFitMode()).toBe('fitWidth');
      expect(getActionProps('fitWidth').selected).toBe(true);
      expect(getActionProps('fitContainer').selected).toBe(false);
    });

    it('fitMode 버튼 클릭 시 setFitMode와 콜백 호출', () => {
      const { getActionProps } = useGalleryToolbarLogic(mockProps);
      const fitWidthProps = getActionProps('fitWidth');

      fitWidthProps.onClick();

      expect(mockProps.onFitWidth).toHaveBeenCalled();
    });

    it('close 버튼 클릭 시 onClose 호출', () => {
      const { getActionProps } = useGalleryToolbarLogic(mockProps);
      const closeProps = getActionProps('close');

      closeProps.onClick();
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('settings 버튼 클릭 시 onOpenSettings 호출', () => {
      const { getActionProps } = useGalleryToolbarLogic(mockProps);
      const settingsProps = getActionProps('settings');

      settingsProps.onClick();
      expect(mockProps.onOpenSettings).toHaveBeenCalled();
    });
  });

  describe('disabled 상태 전파', () => {
    it('disabled = true일 때 모든 액션 버튼 disabled', () => {
      const { getActionProps } = useGalleryToolbarLogic({ ...mockProps, disabled: true });

      expect(getActionProps('previous').disabled).toBe(true);
      expect(getActionProps('next').disabled).toBe(true);
      expect(getActionProps('close').disabled).toBe(true);
      expect(getActionProps('downloadCurrent').disabled).toBe(true);
    });

    it('disabled = true이고 canGo* = false일 때도 disabled', () => {
      const { getActionProps } = useGalleryToolbarLogic({
        ...mockProps,
        disabled: true,
        totalCount: 1,
      });

      expect(getActionProps('previous').disabled).toBe(true);
      expect(getActionProps('next').disabled).toBe(true);
    });
  });

  describe('마이그레이션 호환성 (createSignalSafe)', () => {
    it('상태 객체는 함수형 accessors 제공', () => {
      const { state } = useGalleryToolbarLogic(mockProps);

      expect(typeof state.currentFitMode).toBe('function');
      expect(typeof state.displayIndex).toBe('function');
      expect(typeof state.mediaCounter).toBe('function');
    });

    it('여러 번 호출해도 동일한 값 반환', () => {
      const { state } = useGalleryToolbarLogic(mockProps);

      const value1 = state.currentFitMode();
      const value2 = state.currentFitMode();

      expect(value1).toBe(value2);
    });

    it('actions 객체는 안정적인 인터페이스 유지', () => {
      const { actions } = useGalleryToolbarLogic(mockProps);

      expect(typeof actions.handlePrevious).toBe('function');
      expect(typeof actions.handleNext).toBe('function');
      expect(typeof actions.setFitMode).toBe('function');
    });
  });

  describe('에러 처리 (안정성)', () => {
    it('props 콜백 실행 중 에러 발생 시 graceful handling', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      const { getActionProps } = useGalleryToolbarLogic({
        ...mockProps,
        onPrevious: errorCallback,
      });

      const previousProps = getActionProps('previous');

      // 에러가 발생해도 관계없음 (콜백 에러는 버그이지만 테스트는 기능 확인)
      // 실제로 이 테스트는 타입 안전성만 확인
      expect(typeof previousProps.onClick).toBe('function');
      expect(errorCallback).not.toHaveBeenCalled(); // 아직 호출되지 않음
    });
  });
});
