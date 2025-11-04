/**
 * @file Toolbar 타입 정의
 */

import type { ViewMode, FitMode } from '../../../types';

// Re-export FitMode for component convenience
export type { FitMode };

export interface ToolbarProps {
  currentIndex: number;
  focusedIndex?: number | null;
  totalCount: number;
  isDownloading?: boolean;
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
  role?: 'toolbar';
  tabIndex?: number;
  onFitOriginal?: (event?: Event) => void;
  onFitWidth?: (event?: Event) => void;
  onFitHeight?: (event?: Event) => void;
  onFitContainer?: (event?: Event) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  tweetText?: string | undefined;
}

export type GalleryToolbarProps = ToolbarProps;
