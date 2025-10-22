/**
 * @fileoverview useGalleryToolbarLogic Hook (TDD Phase T2)
 * @description Toolbar 컴포넌트의 헤드리스 로직 분리
 * @version 2.0.0 - Phase A5.3 Step 1: createSignal 직접 사용 (Hook 패턴)
 *
 * 참고: Hook 함수에서는 getSolid().createSignal을 직접 사용합니다.
 * 이는 Hook이 Solid.js 반응성 컨텍스트 내에서 실행되기 때문입니다.
 * 서비스/상태 계층의 모듈 상태와는 다릅니다 (→ createSignalSafe).
 */

import type { Accessor } from 'solid-js';
import { getSolid } from '../external/vendors';
import { gallerySignals } from '../state/signals/gallery.signals';

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

interface MediaCounter {
  current: number;
  total: number;
  progress: number;
}

interface ToolbarState {
  canGoPrevious: () => boolean;
  canGoNext: () => boolean;
  currentFitMode: () => FitMode;
  displayIndex: Accessor<number>;
  mediaCounter: Accessor<MediaCounter>;
}

export function useGalleryToolbarLogic(props: ToolbarLogicProps) {
  const { createSignal, createMemo } = getSolid();
  const [currentFitMode, setCurrentFitMode] = createSignal<FitMode>('fitContainer');

  // Phase 62: 순환 네비게이션 - totalCount > 1이면 항상 활성화
  const canGoPrevious = () => props.totalCount > 1;
  const canGoNext = () => props.totalCount > 1;

  // Phase 64 Step 4: focusedIndex 우선 표시 (createMemo로 반응성 보장)
  const displayIndex = createMemo(() => gallerySignals.focusedIndex.value ?? props.currentIndex);

  // 미디어 카운터 계산 (displayIndex 기반)
  const mediaCounter = createMemo(() => ({
    current: displayIndex() + 1,
    total: props.totalCount,
    progress: ((displayIndex() + 1) / props.totalCount) * 100,
  }));

  // 상태 객체
  const state: ToolbarState = {
    canGoPrevious,
    canGoNext,
    currentFitMode,
    displayIndex,
    mediaCounter,
  };

  // 액션 핸들러
  const actions = {
    handlePrevious: () => {
      if (!props.disabled && canGoPrevious()) {
        props.onPrevious();
      }
    },
    handleNext: () => {
      if (!props.disabled && canGoNext()) {
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
          disabled: props.disabled || !canGoPrevious(),
          onClick: actions.handlePrevious,
        };

      case 'next':
        return {
          ...baseProps,
          disabled: props.disabled || !canGoNext(),
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
          selected: currentFitMode() === 'original',
          onClick: () => {
            actions.setFitMode('original');
            props.onFitOriginal();
          },
        };

      case 'fitWidth':
        return {
          ...baseProps,
          selected: currentFitMode() === 'fitWidth',
          onClick: () => {
            actions.setFitMode('fitWidth');
            props.onFitWidth();
          },
        };

      case 'fitHeight':
        return {
          ...baseProps,
          selected: currentFitMode() === 'fitHeight',
          onClick: () => {
            actions.setFitMode('fitHeight');
            props.onFitHeight();
          },
        };

      case 'fitContainer':
        return {
          ...baseProps,
          selected: currentFitMode() === 'fitContainer',
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
