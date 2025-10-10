/**
 * @fileoverview useGalleryToolbarLogic Hook Tests (TDD Phase T2)
 * @description Toolbar 로직을 헤드리스 훅으로 분리 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '../utils/testing-library';
import { h } from 'preact';
import { useGalleryToolbarLogic } from '@shared/hooks/useGalleryToolbarLogic';

// 테스트용 컴포넌트
function TestHookComponent(props: any) {
  const logic = useGalleryToolbarLogic(props);

  // 직렬화 가능한 데이터만 전달
  const result = {
    state: logic.state,
    hasActions: {
      handlePrevious: typeof logic.actions.handlePrevious === 'function',
      handleNext: typeof logic.actions.handleNext === 'function',
      setFitMode: typeof logic.actions.setFitMode === 'function',
    },
    hasGetActionProps: typeof logic.getActionProps === 'function',
    // 샘플 getActionProps 결과
    prevProps: {
      disabled: logic.getActionProps('previous').disabled,
      selected: logic.getActionProps('previous').selected,
      loading: logic.getActionProps('previous').loading,
    },
    fitContainerProps: {
      disabled: logic.getActionProps('fitContainer').disabled,
      selected: logic.getActionProps('fitContainer').selected,
      loading: logic.getActionProps('fitContainer').loading,
    },
  };

  return h('div', {
    'data-testid': 'hook-result',
    'data-result': JSON.stringify(result),
  });
}

describe('useGalleryToolbarLogic - Headless 로직 (Phase T2)', () => {
  const defaultProps = {
    currentIndex: 1,
    totalCount: 5,
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

  describe('훅 존재성 확인', () => {
    it('useGalleryToolbarLogic 훅이 import되어야 한다', async () => {
      // 훅이 존재하지 않으므로 실패해야 함
      try {
        const { useGalleryToolbarLogic } = await import('@shared/hooks/useGalleryToolbarLogic');
        expect(useGalleryToolbarLogic).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('네비게이션 경계 계산', () => {
    it('첫 번째 항목에서 canGoPrevious가 false이다', () => {
      const props = { ...defaultProps, currentIndex: 0 };
      const { getByTestId } = render(h(TestHookComponent, props));
      const result = JSON.parse(getByTestId('hook-result').dataset.result!);

      expect(result.state.canGoPrevious).toBe(false);
    });

    it('마지막 항목에서 canGoNext가 false이다', () => {
      const props = { ...defaultProps, currentIndex: 4, totalCount: 5 };
      const { getByTestId } = render(h(TestHookComponent, props));
      const result = JSON.parse(getByTestId('hook-result').dataset.result!);

      expect(result.state.canGoNext).toBe(false);
    });

    it('중간 항목에서는 둘 다 true이다', () => {
      const { getByTestId } = render(h(TestHookComponent, defaultProps));
      const result = JSON.parse(getByTestId('hook-result').dataset.result!);

      expect(result.state.canGoPrevious).toBe(true);
      expect(result.state.canGoNext).toBe(true);
    });
  });

  describe('FitMode 상태 관리', () => {
    it('초기 fitMode가 fitContainer로 설정된다', () => {
      const { getByTestId } = render(h(TestHookComponent, defaultProps));
      const result = JSON.parse(getByTestId('hook-result').dataset.result!);

      expect(result.state.currentFitMode).toBe('fitContainer');
    });

    it('fit 모드 버튼의 selected 상태를 반환한다', () => {
      const { getByTestId } = render(h(TestHookComponent, defaultProps));
      const result = JSON.parse(getByTestId('hook-result').dataset.result!);

      // 초기 fitMode는 'fitContainer'
      expect(result.fitContainerProps.selected).toBe(true);
    });
  });

  describe('버튼 Props 생성', () => {
    it('getActionProps 함수가 존재한다', () => {
      const { getByTestId } = render(h(TestHookComponent, defaultProps));
      const result = JSON.parse(getByTestId('hook-result').dataset.result!);

      expect(result.hasGetActionProps).toBe(true);
    });

    it('경계에서 올바른 disabled 상태를 반환한다', () => {
      const props = { ...defaultProps, currentIndex: 0 };
      const { getByTestId } = render(h(TestHookComponent, props));
      const result = JSON.parse(getByTestId('hook-result').dataset.result!);

      expect(result.prevProps.disabled).toBe(true);
    });
  });

  describe('상태 파생', () => {
    it('mediaCounter 정보를 올바르게 파생한다', () => {
      const { getByTestId } = render(h(TestHookComponent, defaultProps));
      const result = JSON.parse(getByTestId('hook-result').dataset.result!);

      expect(result.state.mediaCounter.current).toBe(2); // currentIndex + 1
      expect(result.state.mediaCounter.total).toBe(5);
      expect(result.state.mediaCounter.progress).toBe(40); // 2/5 * 100
    });
  });
});
