import type { ToolbarHandlers } from '@shared/components/ui/Toolbar/handler-types';
import type { FitMode, ViewMode } from '@shared/types';
import type { MaybeAccessor } from '@shared/utils/solid/accessor-utils';

export type { FitMode, MaybeAccessor };
export type {
  
  FitModeHandlers,
  
  
  
  
} from '@shared/components/ui/Toolbar/handler-types';

/**
 * Toolbar component props with grouped handler pattern
 *
 * @example
 * ```tsx
 * <Toolbar
 *   currentIndex={0}
 *   totalCount={10}
 *   handlers={{
 *     navigation: { onPrevious: handlePrev, onNext: handleNext },
 *     download: { onDownloadCurrent: handleCurrent, onDownloadAll: handleAll },
 *     lifecycle: { onClose: handleClose },
 *   }}
 * />
 * ```
 */
export interface ToolbarProps {
  /** Current media index (0-based) */
  currentIndex: MaybeAccessor<number>;
  /** Focused index for keyboard navigation (null if none) */
  focusedIndex?: MaybeAccessor<number | null>;
  /** Total number of media items */
  totalCount: MaybeAccessor<number>;

  /**
   * Grouped handlers for toolbar actions
   * @see ToolbarHandlers
   */
  handlers: ToolbarHandlers;

  /** Current view mode (e.g., 'grid', 'single') */
  currentViewMode?: MaybeAccessor<ViewMode | undefined>;
  /** Callback when view mode changes */
  onViewModeChange?: ((mode: ViewMode) => void) | undefined;
  /** Current fit mode for image display */
  currentFitMode?: MaybeAccessor<FitMode | undefined>;

  /** Whether a download is in progress */
  isDownloading?: MaybeAccessor<boolean | undefined>;
  /** Whether toolbar controls are disabled */
  disabled?: MaybeAccessor<boolean | undefined>;
  /** Additional CSS class name */
  className?: string | undefined;
  /** Toolbar position relative to gallery */
  position?: 'top' | 'bottom' | 'left' | 'right' | undefined;

  /** ARIA label for accessibility */
  'aria-label'?: string | undefined;
  /** ARIA describedby for accessibility */
  'aria-describedby'?: string | undefined;
  /** ARIA role (defaults to 'toolbar') */
  role?: 'toolbar' | undefined;
  /** Tab index for keyboard navigation */
  tabIndex?: number | undefined;
  /** Test ID for testing */
  'data-testid'?: string | undefined;

  /** Tweet text content */
  tweetText?: MaybeAccessor<string | null | undefined>;
  /** Tweet HTML content */
  tweetTextHTML?: MaybeAccessor<string | null | undefined>;
}
