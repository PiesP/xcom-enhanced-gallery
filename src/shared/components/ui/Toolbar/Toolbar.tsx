/**
 * @fileoverview Gallery Toolbar Container Component
 * @description Container component that coordinates toolbar state management and delegates rendering
 * to ToolbarView. Handles media navigation, download operations, fit modes, and expandable panels
 * (settings and tweet text) with full Solid.js reactivity.
 *
 * @architecture
 * ## Component Structure
 * - **Toolbar Container** (this component): State coordination, memoization, event handlers
 * - **ToolbarView**: Presentational component for rendering DOM structure
 * - **Pattern**: Container/Presentational split following Solid.js best practices
 * - **Dependency**: Hooks (useToolbarState, useToolbarSettingsController), utilities, icons
 *
 * ## State Management
 * - **Toolbar State**: useToolbarState hook manages download/error states
 * - **Settings Panel**: Controlled via isSettingsExpanded signal (exclusive with tweet panel)
 * - **Tweet Panel**: Controlled via isTweetPanelExpanded signal (exclusive with settings panel)
 * - **Memoization**: All callbacks wrapped in createMemo to prevent unnecessary re-renders
 *
 * ## Navigation & Display
 * - **Current vs Focused**: displayedIndex prioritizes focusedIndex over currentIndex
 * - **Progress Calculation**: width = (displayedIndex + 1) / totalCount * 100%
 * - **Disable Logic**: Previous/Next disabled when totalCount ≤ 1
 * - **Media Counter**: Real-time updates via createMemo reactivity
 *
 * ## Fit Mode Handling
 * - **FitMode Types**: 'fitContainer', 'fitWidth', 'fitHeight', 'original'
 * - **Icon Mapping**: ArrowsPointingOut, ArrowsRightLeft, ArrowsUpDown, ArrowsPointingIn
 * - **Disable Logic**: Disabled when no handler provided or toolbar disabled
 * - **Dynamic Click Handlers**: Each mode has handler memoization + event prevent logic
 *
 * ## Panel Management
 * - **Exclusive Toggle**: Settings & Tweet panels mutually exclusive
 * - **Settings Opens**: Closes tweet panel automatically
 * - **Tweet Opens**: Closes settings panel automatically
 * - **Controller Integration**: ToolbarSettingsController manages settings panel state
 *
 * ## Accessibility Features
 * - **ARIA Attributes**: role='toolbar', aria-label, aria-expanded states
 * - **Keyboard Navigation**: onKeyDown handler managed by settingsController
 * - **Focus Management**: ref assignments for focus trap integration
 * - **Live Regions**: Media counter with aria-live='polite'
 * - **Icon Buttons**: All buttons have descriptive aria-label attributes
 *
 * @reactivityModel
 * ```
 * displayedIndex() → updated when currentIndex or focusedIndex changes
 * progressWidth() → recalculated when displayedIndex or totalCount changes
 * navState() → recalculated when disabled/downloading/totalCount changes
 * toolbarClass() → regenerated when state changes
 * handleFitModeClick() → memoized to prevent callback recreations
 * ```
 *
 * @performance
 * - **Memoization**: All event handlers memoized with createMemo
 * - **Props Merging**: Defaults applied via mergeProps (Solid standard)
 * - **Ref Assignments**: Via ref callbacks to SettingsController
 * - **Event Prevention**: safeEventPrevent/safeEventPreventAll utility functions
 *
 * @dependencies
 * - Solid.js API: getSolid(), createMemo, createEffect, on, createSignal
 * - Hooks: useToolbarState, useToolbarSettingsController
 * - Types: ToolbarProps, FitMode, ToolbarState
 * - Services: (via hooks)
 * - Icons: ArrowsPointingIn, ArrowsRightLeft, ArrowsUpDown, ArrowsPointingOut
 * - Views: ToolbarView (presentational)
 *
 * @example
 * ```typescript
 * // Basic usage with required props
 * <Toolbar
 *   currentIndex={0}
 *   totalCount={5}
 *   onPrevious={() => setIndex(i => i - 1)}
 *   onNext={() => setIndex(i => i + 1)}
 *   onDownloadCurrent={() => downloadCurrent()}
 *   onDownloadAll={() => downloadAll()}
 *   onClose={() => closeGallery()}
 * />
 *
 * // Full-featured with all optional props
 * <Toolbar
 *   currentIndex={activeIndex()}
 *   focusedIndex={hoveredIndex()}
 *   totalCount={mediaList().length}
 *   isDownloading={isDownloading()}
 *   disabled={isLoading()}
 *   currentViewMode="fit"
 *   onViewModeChange={(mode) => setViewMode(mode)}
 *   onPrevious={() => setActiveIndex(i => i - 1)}
 *   onNext={() => setActiveIndex(i => i + 1)}
 *   onDownloadCurrent={downloadSingle}
 *   onDownloadAll={downloadBulk}
 *   onClose={closeGallery}
 *   onOpenSettings={openSettingsPanel}
 *   onFitOriginal={(e) => setFitMode('original')}
 *   onFitWidth={(e) => setFitMode('fitWidth')}
 *   onFitHeight={(e) => setFitMode('fitHeight')}
 *   onFitContainer={(e) => setFitMode('fitContainer')}
 *   tweetText={tweet.text}
 *   tweetTextHTML={tweet.html}
 *   className="custom-toolbar-class"
 *   aria-label="Media gallery controls"
 *   data-testid="gallery-toolbar"
 * />
 * ```
 *
 * @notes
 * - Phase 87: Event handler memoization reduces callback recreations
 * - Phase 87: Props accessed directly (no destructuring) for better reactivity
 * - Settings Controller enhanced with onSettingsClick callback for onOpenSettings prop
 * - Panel labels from fitModeLabels use Korean localization (phase-specific)
 * - High contrast offsets defined for theme accessibility
 */

import type { JSXElement } from '../../../external/vendors';
import { getSolid } from '../../../external/vendors';
import { useToolbarState } from '../../../hooks/use-toolbar-state';
import { getToolbarDataState, getToolbarClassName } from '../../../utils/toolbar-utils';
import { createClassName } from '@shared/utils/component-utils'; // Phase 284: individual function direct import
import { ArrowsPointingIn, ArrowsRightLeft, ArrowsUpDown, ArrowsPointingOut } from '../Icon';
import type { ToolbarSettingsControllerResult } from '../../../hooks/toolbar/use-toolbar-settings-controller';
import { useToolbarSettingsController } from '../../../hooks/toolbar/use-toolbar-settings-controller';
import { ToolbarView } from './ToolbarView';
import type { ToolbarProps, FitMode } from './Toolbar.types';
import { safeEventPreventAll, safeEventPrevent } from '@shared/utils/event-utils';
import styles from './Toolbar.module.css';

const solid = getSolid();

/**
 * @constant DEFAULT_TOOLBAR_PROPS
 * @description Default values for optional toolbar props
 * Ensures safe access to all properties even if not provided
 */
const DEFAULT_TOOLBAR_PROPS = {
  isDownloading: false,
  disabled: false,
  className: '',
} as const;

/**
 * @constant fitModeLabels
 * @description Localized labels for each fit mode
 * Provides accessible aria-label and title attributes for fit mode buttons
 * Current Phase: Uses Korean localization
 * TODO: Integrate with i18n system for multi-language support
 */
const fitModeLabels = {
  original: {
    label: '원본 크기',
    title: '원본 크기 (1:1)',
  },
  fitWidth: {
    label: '가로에 맞춤',
    title: '가로에 맞추기',
  },
  fitHeight: {
    label: '세로에 맞춤',
    title: '세로에 맞추기',
  },
  fitContainer: {
    label: '창에 맞춤',
    title: '창에 맞추기',
  },
} as const satisfies Record<FitMode, { label: string; title: string }>;

/**
 * @constant FIT_MODE_ORDER
 * @description Ordered array of fit modes with their associated icons
 * Determines the left-to-right order of fit mode buttons in toolbar
 */
const FIT_MODE_ORDER = [
  { mode: 'original' as const, Icon: ArrowsPointingOut },
  { mode: 'fitWidth' as const, Icon: ArrowsRightLeft },
  { mode: 'fitHeight' as const, Icon: ArrowsUpDown },
  { mode: 'fitContainer' as const, Icon: ArrowsPointingIn },
] as const;

/**
 * @constant HIGH_CONTRAST_OFFSETS
 * @description Brightness adjustment levels for high contrast mode
 * Used by ToolbarSettingsController for dynamic theme adjustment
 * Values: 0.25 (25% darker), 0.5 (50% darker), 0.75 (75% darker)
 */
const HIGH_CONTRAST_OFFSETS = [0.25, 0.5, 0.75] as const;

/**
 * @function ToolbarContainer
 * @description Main container component for Gallery Toolbar
 * Coordinates state management and delegates rendering to ToolbarView
 *
 * @param rawProps - ToolbarProps with all navigation, download, and display props
 * @returns JSXElement - Delegates to ToolbarView for rendering
 *
 * @state
 * - toolbarState: Download/error state from useToolbarState
 * - isSettingsExpanded: Local signal for settings panel visibility
 * - isTweetPanelExpanded: Local signal for tweet panel visibility
 * - settingsController: Manages settings panel interaction and theme changes
 *
 * @reactivity
 * - displayedIndex(): Memo that prioritizes focusedIndex over currentIndex
 * - progressWidth(): Memo calculating percentage of gallery progress
 * - navState(): Memo determining button disable states
 * - toolbarClass(): Memo generating CSS classes from state
 * - All event handlers: Memoized callbacks to prevent re-renders
 */
function ToolbarContainer(rawProps: ToolbarProps): JSXElement {
  const { mergeProps, createMemo, createEffect, on, createSignal } = solid;

  /**
   * Props with defaults applied via mergeProps (Solid standard pattern)
   * Ensures all optional props have fallback values
   */
  const props = mergeProps(DEFAULT_TOOLBAR_PROPS, rawProps);

  /**
   * Toolbar state: download, error, loading states
   * Managed externally and provided via hook
   */
  const [toolbarState, toolbarActions] = useToolbarState();

  /**
   * Local settings expanded state (component-owned for proper reactivity)
   * When true: settings panel expands, tweet panel closes (mutually exclusive)
   */
  const [isSettingsExpanded, setIsSettingsExpanded] = createSignal(false);

  /**
   * Local tweet panel expanded state (component-owned for proper reactivity)
   * When true: tweet panel expands, settings panel closes (mutually exclusive)
   */
  const [isTweetPanelExpanded, setIsTweetPanelExpanded] = createSignal(false);

  /**
   * Toggle settings panel and close tweet panel
   * Phase 87: Exclusive toggle pattern for mutually exclusive panels
   */
  const toggleSettingsExpanded = () => {
    setIsSettingsExpanded(prev => {
      const nextState = !prev;
      if (nextState) {
        // Close tweet panel when opening settings
        setIsTweetPanelExpanded(false);
      }
      return nextState;
    });
  };

  /**
   * Toggle tweet panel and close settings panel
   * Phase 87: Exclusive toggle pattern for mutually exclusive panels
   */
  const toggleTweetPanelExpanded = () => {
    setIsTweetPanelExpanded(prev => {
      const nextState = !prev;
      if (nextState) {
        // Close settings panel when opening tweet
        setIsSettingsExpanded(false);
      }
      return nextState;
    });
  };

  /**
   * @memo toolbarClass
   * @description Generate CSS classes combining multiple sources
   * - Base toolbar styles
   * - Gallery-specific toolbar styles
   * - User-provided className prop
   */
  const toolbarClass = createMemo(() =>
    createClassName(
      styles.toolbar,
      getToolbarClassName(toolbarState, styles.galleryToolbar || ''),
      props.className ?? ''
    )
  );

  /**
   * @memo displayedIndex
   * @description Calculate which media index to display
   * Priority order: focusedIndex (if valid) → currentIndex (if valid) → 0
   * Used for media counter (displayedIndex + 1 of totalCount)
   */
  const displayedIndex = createMemo((): number => {
    const total = props.totalCount;
    if (!(typeof total === 'number' && total > 0)) {
      return 0;
    }

    const focus = props.focusedIndex;
    if (typeof focus === 'number' && focus >= 0 && focus < total) {
      return focus;
    }

    const current = props.currentIndex;
    if (typeof current === 'number' && current >= 0 && current < total) {
      return current;
    }

    const clampedCurrent = Math.min(Math.max(Number(current) || 0, 0), total - 1);
    return clampedCurrent;
  });

  /**
   * @memo progressWidth
   * @description Calculate progress bar width as percentage
   * Formula: (displayedIndex + 1) / totalCount * 100%
   * Returns '0%' if totalCount ≤ 0
   */
  const progressWidth = createMemo((): string => {
    if (props.totalCount <= 0) {
      return '0%';
    }
    return `${((displayedIndex() + 1) / props.totalCount) * 100}%`;
  });

  /**
   * @effect Download state sync
   * When isDownloading prop changes, update toolbar state actions
   * Used to reflect download progress in toolbar UI
   */
  createEffect(
    on(
      () => props.isDownloading,
      isDownloading => {
        toolbarActions.setDownloading(!!isDownloading);
      }
    )
  );

  /**
   * Settings Controller
   * Manages settings panel interaction, theme changes, and focus management
   * Integrates with ToolbarSettingsController hook for comprehensive control
   */
  const settingsController = useToolbarSettingsController({
    setNeedsHighContrast: toolbarActions.setHighContrast,
    isSettingsExpanded,
    setSettingsExpanded: setIsSettingsExpanded,
    toggleSettingsExpanded,
    highContrastOffsets: HIGH_CONTRAST_OFFSETS,
  });

  /**
   * Enhanced Settings Controller
   * Wraps original settingsController to integrate onOpenSettings callback
   * Phase 87: Callback integration for external settings open handler
   */
  const enhancedSettingsController = {
    ...settingsController,
    handleSettingsClick: (event: MouseEvent) => {
      const wasExpanded = settingsController.isSettingsExpanded();
      settingsController.handleSettingsClick(event);
      if (!wasExpanded && settingsController.isSettingsExpanded()) {
        props.onOpenSettings?.();
      }
    },
  } satisfies ToolbarSettingsControllerResult;

  /**
   * @memo toolbarDataState
   * @description Get current toolbar state string for data attributes
   * Values: 'idle', 'loading', 'downloading', 'error'
   * Used for styling toolbar based on state
   */
  const toolbarDataState = createMemo(() => getToolbarDataState(toolbarState));

  /**
   * Get fit mode callback handler
   * Returns appropriate onFit* handler for given fit mode
   * Falls back to undefined if no handler provided
   */
  const getFitHandler = (mode: FitMode): ToolbarProps['onFitOriginal'] => {
    switch (mode) {
      case 'fitWidth':
        return props.onFitWidth ?? undefined;
      case 'fitHeight':
        return props.onFitHeight ?? undefined;
      case 'fitContainer':
        return props.onFitContainer ?? undefined;
      default:
        return props.onFitOriginal ?? undefined;
    }
  };

  /**
   * @memo handleFitModeClick
   * @description Memoized callback for fit mode button clicks
   * Phase 87: Memoization prevents unnecessary callback recreations
   * Behavior: Prevent default, check disabled, invoke handler
   */
  const handleFitModeClick = createMemo(() => {
    const disabled = props.disabled;
    return (mode: FitMode) => (event: MouseEvent) => {
      safeEventPreventAll(event);
      if (!disabled) {
        getFitHandler(mode)?.(event);
      }
    };
  });

  /**
   * Check if fit mode button should be disabled
   * Disabled if: toolbar disabled OR no handler for this fit mode
   */
  const isFitDisabled = (mode: FitMode): boolean => props.disabled || !getFitHandler(mode);

  /**
   * @memo onPreviousClick
   * @description Memoized callback for previous button
   * Phase 87: Event handler memoization to prevent re-renders
   */
  const onPreviousClick = createMemo(() => (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onPrevious?.();
  });

  /**
   * @memo onNextClick
   * @description Memoized callback for next button
   * Phase 87: Event handler memoization to prevent re-renders
   */
  const onNextClick = createMemo(() => (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onNext?.();
  });

  /**
   * @memo onDownloadCurrent
   * @description Memoized callback for download current button
   * Phase 87: Event handler memoization to prevent re-renders
   */
  const onDownloadCurrent = createMemo(() => (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onDownloadCurrent?.();
  });

  /**
   * @memo onDownloadAll
   * @description Memoized callback for download all button
   * Phase 87: Event handler memoization to prevent re-renders
   */
  const onDownloadAll = createMemo(() => (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onDownloadAll?.();
  });

  /**
   * @memo onCloseClick
   * @description Memoized callback for close button
   * Phase 87: Event handler memoization to prevent re-renders
   */
  const onCloseClick = createMemo(() => (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onClose?.();
  });

  /**
   * @memo navState
   * @description Memoized navigation button state
   * Determines which navigation buttons should be disabled:
   * - prevDisabled/nextDisabled: True if disabled prop or totalCount ≤ 1
   * - canDownloadAll: True if totalCount > 1 (show bulk download button)
   * - downloadDisabled: True if disabled or downloading
   */
  const navState = createMemo(() => {
    const total = Math.max(0, props.totalCount ?? 0);
    const disabled = !!props.disabled;
    const isDownloading = !!props.isDownloading;

    const prevDisabled = disabled || total <= 1;
    const nextDisabled = disabled || total <= 1;
    const downloadDisabled = disabled || isDownloading;
    const canDownloadAll = total > 1;

    return {
      prevDisabled,
      nextDisabled,
      canDownloadAll,
      downloadDisabled,
      anyActionDisabled: prevDisabled || nextDisabled || downloadDisabled,
    } as const;
  });

  /**
   * Determine if settings button should render
   * Renders only if onOpenSettings callback provided
   */
  const showSettingsButton = typeof props.onOpenSettings === 'function';

  /**
   * Render via Solid.js createComponent (dynamic component creation)
   * Passes all computed memoized values and handlers to ToolbarView
   */
  const { createComponent } = solid;
  return createComponent(ToolbarView, {
    ...props,
    toolbarClass,
    toolbarState,
    toolbarDataState,
    navState,
    displayedIndex,
    progressWidth,
    fitModeOrder: FIT_MODE_ORDER,
    fitModeLabels,
    handleFitModeClick: handleFitModeClick(),
    isFitDisabled,
    onPreviousClick: onPreviousClick(),
    onNextClick: onNextClick(),
    onDownloadCurrent: onDownloadCurrent(),
    onDownloadAll: onDownloadAll(),
    onCloseClick: onCloseClick(),
    settingsController: enhancedSettingsController,
    showSettingsButton,
    isTweetPanelExpanded,
    toggleTweetPanelExpanded,
  });
}

export type { ToolbarProps, GalleryToolbarProps, FitMode } from './Toolbar.types';
export const Toolbar = ToolbarContainer;

export default ToolbarContainer;
