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

  currentViewMode?: ViewMode | undefined;
  onViewModeChange?: ((mode: ViewMode) => void) | undefined;
  currentFitMode?: FitMode;

  onFitOriginal?: (event?: Event) => void;
  onFitWidth?: (event?: Event) => void;
  onFitHeight?: (event?: Event) => void;
  onFitContainer?: (event?: Event) => void;

  isDownloading?: boolean | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  position?: 'top' | 'bottom' | 'left' | 'right' | undefined;

  'aria-label'?: string | undefined;
  'aria-describedby'?: string | undefined;
  role?: 'toolbar' | undefined;
  tabIndex?: number | undefined;
  'data-testid'?: string | undefined;

  onFocus?: ((event: FocusEvent) => void) | undefined;
  onBlur?: ((event: FocusEvent) => void) | undefined;
  onKeyDown?: ((event: KeyboardEvent) => void) | undefined;

  tweetText?: string | null | undefined;
  tweetTextHTML?: string | null | undefined;
}
