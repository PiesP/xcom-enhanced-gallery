/**
 * @fileoverview UI 컴포넌트 Props 타입 정의
 * @description Phase 2-3A: StandardProps에서 분리된 UI 전용 타입
 * @version 2.0.0
 */

import type {
  BaseComponentProps,
  InteractiveComponentProps,
  SizedComponentProps,
  VariantComponentProps,
  FormComponentProps,
} from '../../types/app.types';

/**
 * 표준화된 Button Props
 */
export interface StandardButtonProps
  extends InteractiveComponentProps,
    SizedComponentProps,
    VariantComponentProps,
    FormComponentProps {}

/**
 * 표준화된 Toast Props
 */
export interface StandardToastProps extends BaseComponentProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  duration?: number;
  autoClose?: boolean;
  onClose?: () => void;
  role?: 'alert' | 'status' | 'log';
}

/**
 * 표준화된 ToastContainer Props
 */
export interface StandardToastContainerProps extends BaseComponentProps {
  maxToasts?: number;
  position?:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-center'
    | 'bottom-center';
}

/**
 * 표준화된 Toolbar Props
 */
export interface StandardToolbarProps extends BaseComponentProps {
  currentIndex: number;
  totalCount: number;
  isDownloading?: boolean;
  disabled?: boolean;
  currentViewMode?: string;
  onViewModeChange?: (mode: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onDownloadCurrent: () => void;
  onDownloadAll: () => void;
  onClose: () => void;
  onOpenSettings?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
}
