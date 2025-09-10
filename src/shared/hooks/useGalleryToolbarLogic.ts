/**
 * @fileoverview useGalleryToolbarLogic Hook (TDD Phase T2)
 * @description Toolbar 컴포넌트의 헤드리스 로직 분리
 */

import { getPreactHooks } from '@shared/external/vendors';

type FitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';

export type ActionType =
  | 'previous'
  | 'next'
  | 'downloadCurrent'
  | 'downloadAll'
  | 'close'
  | 'settings'
  | 'fitOriginal'
  | 'fitWidth'
  | 'fitHeight'
  | 'fitContainer';

interface ToolbarLogicProps {
  currentIndex: number;
  totalCount: number;
  isDownloading: boolean;
  disabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onDownloadCurrent: () => void;
  onDownloadAll: () => void;
  onClose: () => void;
  onOpenSettings: () => void;
  onFitOriginal: () => void;
  onFitWidth: () => void;
  onFitHeight: () => void;
  onFitContainer: () => void;
}

interface ButtonProps {
  disabled: boolean;
  selected?: boolean;
  loading?: boolean;
  onClick: () => void;
}

interface ToolbarState {
  canGoPrevious: boolean;
  canGoNext: boolean;
  currentFitMode: FitMode;
  mediaCounter: {
    current: number;
    total: number;
    progress: number;
  };
}

export function useGalleryToolbarLogic(props: ToolbarLogicProps) {
  const { useState } = getPreactHooks();
  const [currentFitMode, setCurrentFitMode] = useState<FitMode>('fitContainer');

  // 네비게이션 경계 계산
  const canGoPrevious = props.currentIndex > 0;
  const canGoNext = props.currentIndex < props.totalCount - 1;

  // 미디어 카운터 계산
  const mediaCounter = {
    current: props.currentIndex + 1,
    total: props.totalCount,
    progress: ((props.currentIndex + 1) / props.totalCount) * 100,
  };

  // 상태 객체
  const state: ToolbarState = {
    canGoPrevious,
    canGoNext,
    currentFitMode,
    mediaCounter,
  };

  // 액션 핸들러
  const actions = {
    handlePrevious: () => {
      if (!props.disabled && canGoPrevious) {
        props.onPrevious();
      }
    },
    handleNext: () => {
      if (!props.disabled && canGoNext) {
        props.onNext();
      }
    },
    setFitMode: (mode: FitMode) => {
      setCurrentFitMode(mode);
    },
  };

  // 버튼 Props 생성기
  const getActionProps = (actionType: ActionType): ButtonProps => {
    const baseProps = {
      disabled: props.disabled,
      onClick: () => {},
    };

    switch (actionType) {
      case 'previous':
        return {
          ...baseProps,
          disabled: props.disabled || !canGoPrevious,
          onClick: actions.handlePrevious,
        };

      case 'next':
        return {
          ...baseProps,
          disabled: props.disabled || !canGoNext,
          onClick: actions.handleNext,
        };

      case 'downloadCurrent':
        return {
          ...baseProps,
          disabled: props.disabled || props.isDownloading,
          loading: props.isDownloading,
          onClick: props.onDownloadCurrent,
        };

      case 'downloadAll':
        return {
          ...baseProps,
          disabled: props.disabled || props.isDownloading,
          loading: props.isDownloading,
          onClick: props.onDownloadAll,
        };

      case 'close':
        return {
          ...baseProps,
          onClick: props.onClose,
        };

      case 'settings':
        return {
          ...baseProps,
          onClick: props.onOpenSettings,
        };

      case 'fitOriginal':
        return {
          ...baseProps,
          selected: currentFitMode === 'original',
          onClick: () => {
            actions.setFitMode('original');
            props.onFitOriginal();
          },
        };

      case 'fitWidth':
        return {
          ...baseProps,
          selected: currentFitMode === 'fitWidth',
          onClick: () => {
            actions.setFitMode('fitWidth');
            props.onFitWidth();
          },
        };

      case 'fitHeight':
        return {
          ...baseProps,
          selected: currentFitMode === 'fitHeight',
          onClick: () => {
            actions.setFitMode('fitHeight');
            props.onFitHeight();
          },
        };

      case 'fitContainer':
        return {
          ...baseProps,
          selected: currentFitMode === 'fitContainer',
          onClick: () => {
            actions.setFitMode('fitContainer');
            props.onFitContainer();
          },
        };

      default:
        return baseProps;
    }
  };

  return {
    state,
    actions,
    getActionProps,
  };
}
