import type { ViewMode, FitMode } from '@shared/types';

export type { FitMode };

export interface ToolbarProps {
  currentIndex: number;
  focusedIndex?: number | null;
  totalCount: number;

  onPrevious: () => void;
  onNext: () => void;
  onDownloadCurrent: () => void;
  onDownloadAll: () => void;
  onClose: () => void;
  onOpenSettings?: () => void;

  currentViewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;

  onFitOriginal?: (event?: Event) => void;
  onFitWidth?: (event?: Event) => void;
  onFitHeight?: (event?: Event) => void;
  onFitContainer?: (event?: Event) => void;

  isDownloading?: boolean;
  disabled?: boolean;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';

  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: 'toolbar';
  tabIndex?: number;
  'data-testid'?: string;

  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;

  tweetText?: string | null | undefined;
  tweetTextHTML?: string | null | undefined;
}
