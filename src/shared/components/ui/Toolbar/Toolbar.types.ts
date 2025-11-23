import type { ViewMode, FitMode } from "@shared/types";

type Accessor<T> = () => T;

export type MaybeAccessor<T> = T | Accessor<T>;

export type { FitMode };

export interface ToolbarProps {
  currentIndex: MaybeAccessor<number>;
  focusedIndex?: MaybeAccessor<number | null>;
  totalCount: MaybeAccessor<number>;

  onPrevious: () => void;
  onNext: () => void;
  onDownloadCurrent: () => void;
  onDownloadAll: () => void;
  onClose: () => void;
  onOpenSettings?: () => void;

  currentViewMode?: MaybeAccessor<ViewMode | undefined>;
  onViewModeChange?: ((mode: ViewMode) => void) | undefined;
  currentFitMode?: MaybeAccessor<FitMode | undefined>;

  onFitOriginal?: (event?: Event) => void;
  onFitWidth?: (event?: Event) => void;
  onFitHeight?: (event?: Event) => void;
  onFitContainer?: (event?: Event) => void;

  isDownloading?: MaybeAccessor<boolean | undefined>;
  disabled?: MaybeAccessor<boolean | undefined>;
  className?: string | undefined;
  position?: "top" | "bottom" | "left" | "right" | undefined;

  "aria-label"?: string | undefined;
  "aria-describedby"?: string | undefined;
  role?: "toolbar" | undefined;
  tabIndex?: number | undefined;
  "data-testid"?: string | undefined;

  onFocus?: ((event: FocusEvent) => void) | undefined;
  onBlur?: ((event: FocusEvent) => void) | undefined;
  onKeyDown?: ((event: KeyboardEvent) => void) | undefined;

  tweetText?: MaybeAccessor<string | null | undefined>;
  tweetTextHTML?: MaybeAccessor<string | null | undefined>;
}
