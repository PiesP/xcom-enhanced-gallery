import type { ToolbarHandlers } from '@shared/components/ui/Toolbar/handler-types';
import type { ViewMode } from '@shared/types/core/core-types';
import type { FitMode } from '@shared/types/toolbar.types';
import type { MaybeAccessor } from '@shared/utils/solid/accessor-utils';

export type { FitMode, MaybeAccessor };
export type { FitModeHandlers } from '@shared/components/ui/Toolbar/handler-types';

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
  readonly currentIndex: MaybeAccessor<number>;
  /** Focused index for keyboard navigation (null if none) */
  readonly focusedIndex?: MaybeAccessor<number | null> | undefined;
  /** Total number of media items */
  readonly totalCount: MaybeAccessor<number>;

  /**
   * Grouped handlers for toolbar actions
   * @see ToolbarHandlers
   */
  readonly handlers: ToolbarHandlers;

  /** Current view mode (e.g., 'grid', 'single') */
  readonly currentViewMode?: MaybeAccessor<ViewMode | undefined> | undefined;
  /** Callback when view mode changes */
  readonly onViewModeChange?: ((mode: ViewMode) => void) | undefined;
  /** Current fit mode for image display */
  readonly currentFitMode?: MaybeAccessor<FitMode | undefined> | undefined;

  /** Whether a download is in progress */
  readonly isDownloading?: MaybeAccessor<boolean | undefined> | undefined;
  /** Whether toolbar controls are disabled */
  readonly disabled?: MaybeAccessor<boolean | undefined> | undefined;
  /** Additional CSS class name */
  readonly className?: string | undefined;
  /** Toolbar position relative to gallery */
  readonly position?: 'top' | 'bottom' | 'left' | 'right' | undefined;

  /** ARIA label for accessibility */
  readonly 'aria-label'?: string | undefined;
  /** ARIA describedby for accessibility */
  readonly 'aria-describedby'?: string | undefined;
  /** ARIA role (defaults to 'toolbar') */
  readonly role?: 'toolbar' | undefined;
  /** Tab index for keyboard navigation */
  readonly tabIndex?: number | undefined;
  /** Test ID for testing */
  readonly 'data-testid'?: string | undefined;

  /** Tweet text content */
  readonly tweetText?: MaybeAccessor<string | null | undefined> | undefined;
  /** Tweet HTML content */
  readonly tweetTextHTML?: MaybeAccessor<string | null | undefined> | undefined;
  /** Tweet URL */
  readonly tweetUrl?: MaybeAccessor<string | null | undefined> | undefined;
}
