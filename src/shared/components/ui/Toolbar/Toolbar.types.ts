/**
 * @fileoverview Toolbar Props Types (순환 의존성 방지용 타입 분리)
 */

import type { JSX } from 'solid-js';
import type { ViewMode, ImageFitMode } from '@shared/types';

export interface ToolbarProps {
  currentIndex: number;
  totalCount: number;
  isDownloading?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  currentViewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onPrevious: () => void;
  onNext: () => void;
  onDownloadCurrent: () => void;
  onDownloadAll: () => void;
  onClose: () => void;
  onOpenSettings?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: JSX.AriaRole;
  tabIndex?: number;
  currentFitMode?: ImageFitMode;
  onFitOriginal?: (event?: Event) => void;
  onFitWidth?: (event?: Event) => void;
  onFitHeight?: (event?: Event) => void;
  onFitContainer?: (event?: Event) => void;
  onShowKeyboardHelp?: () => void; // Phase 1-3: Keyboard hint button
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

export type GalleryToolbarProps = ToolbarProps;
