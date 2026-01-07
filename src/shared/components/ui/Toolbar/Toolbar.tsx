// External dependencies

import type { LucideIconName } from '@shared/components/ui/Icon/lucide/icon-nodes';
import { ToolbarView } from '@shared/components/ui/Toolbar/ToolbarView';
import type {
  FitMode,
  FitModeHandlers,
  ToolbarProps,
} from '@shared/components/ui/Toolbar/toolbar.types';
import type { JSXElement } from '@shared/external/vendors';
import type { ToolbarSettingsControllerResult } from '@shared/hooks/toolbar/use-toolbar-settings-controller';
import { useToolbarSettingsController } from '@shared/hooks/toolbar/use-toolbar-settings-controller';
import { useToolbarState } from '@shared/hooks/use-toolbar-state';
import { useTranslation } from '@shared/hooks/use-translation';
import type { ToolbarDataState, ToolbarState } from '@shared/types/toolbar.types';
import { safeEventPrevent, safeEventPreventAll } from '@shared/utils/events/utils';
import { toOptionalAccessor, toRequiredAccessor } from '@shared/utils/solid/accessor-utils';
import { cx } from '@shared/utils/text/formatting';
import { clampIndex } from '@shared/utils/types/safety';
import { createEffect, createMemo, createSignal, mergeProps, on, splitProps } from 'solid-js';

// Styles
import styles from './Toolbar.module.css';

const DEFAULT_PROPS = {
  isDownloading: false,
  disabled: false,
  className: '',
} as const;

const FIT_MODE_ORDER: ReadonlyArray<{ mode: FitMode; iconName: LucideIconName }> = [
  { mode: 'original', iconName: 'maximize-2' },
  { mode: 'fitWidth', iconName: 'move-horizontal' },
  { mode: 'fitHeight', iconName: 'move-vertical' },
  { mode: 'fitContainer', iconName: 'minimize-2' },
];

/**
 * Internal fit mode handler mapping type for the toolbar view
 */
type InternalFitModeHandlers = Record<FitMode, FitModeHandlers['onFitOriginal'] | undefined>;

/**
 * Parameters for computing navigation state
 */
interface NavigationStateParams {
  readonly total: number;
  readonly toolbarDisabled: boolean;
  readonly downloadBusy: boolean;
}

/**
 * Resolve the displayed index for UI purposes
 * Prioritizes focused index over current index if valid
 */
const resolveDisplayedIndex = ({
  total,
  currentIndex,
  focusedIndex,
}: {
  total: number;
  currentIndex: number;
  focusedIndex?: number | null | undefined;
}): number => {
  if (total <= 0) {
    return 0;
  }

  if (typeof focusedIndex === 'number' && focusedIndex >= 0 && focusedIndex < total) {
    return focusedIndex;
  }

  return clampIndex(currentIndex, total);
};

/**
 * Calculate progress bar width as percentage
 */
const calculateProgressWidth = (index: number, total: number): string => {
  if (total <= 0) {
    return '0%';
  }

  return `${((index + 1) / total) * 100}%`;
};

/**
 * Compute navigation and action states for toolbar buttons
 */
const computeNavigationState = ({
  total,
  toolbarDisabled,
  downloadBusy,
}: NavigationStateParams) => {
  const hasItems = total > 0;
  const canNavigate = hasItems && total > 1;
  const prevDisabled = toolbarDisabled || !canNavigate;
  const nextDisabled = toolbarDisabled || !canNavigate;
  const downloadDisabled = toolbarDisabled || downloadBusy || !hasItems;

  return {
    prevDisabled,
    nextDisabled,
    canDownloadAll: total > 1,
    downloadDisabled,
    anyActionDisabled: toolbarDisabled,
  } as const;
};

/**
 * Create a guarded event handler with conditional execution
 * @param guard - Function to check if handler should be blocked
 * @param action - Action to execute if guard passes
 */
const createGuardedHandler = (
  guard: () => boolean,
  action?: () => void
): ((event: MouseEvent) => void) => {
  return (event) => {
    safeEventPrevent(event);
    if (guard()) {
      return;
    }
    action?.();
  };
};

/**
 * Derive toolbar data state from toolbar state object
 */
function getToolbarDataState(state: ToolbarState): ToolbarDataState {
  if (state.hasError) return 'error';
  if (state.isDownloading) return 'downloading';
  if (state.isLoading) return 'loading';
  return 'idle';
}

/**
 * Main toolbar component container
 * Manages toolbar state, handlers, and coordinates with ToolbarView
 */
function ToolbarContainer(rawProps: ToolbarProps): JSXElement {
  // 1. Props merging and splitting (preserve reactivity)
  const props = mergeProps(DEFAULT_PROPS, rawProps);
  const [local, domProps] = splitProps(props, [
    'currentIndex',
    'totalCount',
    'focusedIndex',
    'isDownloading',
    'disabled',
    'className',
    'currentFitMode',
    'handlers',
    'tweetText',
    'tweetTextHTML',
    'tweetUrl',
  ]);

  // 2. Accessors for reactive props
  const currentIndex = toRequiredAccessor(() => local.currentIndex, 0);
  const totalCount = toRequiredAccessor(() => local.totalCount, 0);
  const focusedIndex = toRequiredAccessor(() => local.focusedIndex, null);
  const isDownloadingProp = toRequiredAccessor(() => local.isDownloading, false);
  const isDisabled = toRequiredAccessor(() => local.disabled, false);
  const currentFitMode = toOptionalAccessor(() => local.currentFitMode);
  const tweetText = toOptionalAccessor(() => local.tweetText);
  const tweetTextHTML = toOptionalAccessor(() => local.tweetTextHTML);
  const tweetUrl = toOptionalAccessor(() => local.tweetUrl);

  // 3. Hooks
  const translate = useTranslation();
  const [toolbarState, toolbarActions] = useToolbarState();

  // 4. Signal declarations
  const [settingsExpandedSignal, setSettingsExpandedSignal] = createSignal<boolean>(false);
  const [tweetExpanded, setTweetExpanded] = createSignal<boolean>(false);

  // 5. Derived memos
  const toolbarClass = createMemo(() => cx(styles.toolbar, styles.galleryToolbar, local.className));
  const totalItems = createMemo(() => Math.max(0, totalCount()));
  const currentIndexForNav = createMemo(() => clampIndex(currentIndex(), totalItems()));

  const displayedIndex = createMemo(() =>
    resolveDisplayedIndex({
      total: totalItems(),
      currentIndex: currentIndexForNav(),
      focusedIndex: focusedIndex(),
    })
  );

  const progressWidth = createMemo(() => calculateProgressWidth(displayedIndex(), totalItems()));
  const toolbarDataState = createMemo(() => getToolbarDataState(toolbarState));

  const navState = createMemo(() =>
    computeNavigationState({
      total: totalItems(),
      toolbarDisabled: !!isDisabled(),
      downloadBusy: !!(isDownloadingProp() || toolbarState.isDownloading),
    })
  );

  const fitModeHandlers = createMemo<InternalFitModeHandlers>(() => ({
    original: local.handlers.fitMode?.onFitOriginal,
    fitWidth: local.handlers.fitMode?.onFitWidth,
    fitHeight: local.handlers.fitMode?.onFitHeight,
    fitContainer: local.handlers.fitMode?.onFitContainer,
  }));

  const fitModeLabels = createMemo<Record<FitMode, { label: string; title: string }>>(() => ({
    original: {
      label: translate('tb.fitOri'),
      title: translate('tb.fitOri'),
    },
    fitWidth: {
      label: translate('tb.fitW'),
      title: translate('tb.fitW'),
    },
    fitHeight: {
      label: translate('tb.fitH'),
      title: translate('tb.fitH'),
    },
    fitContainer: {
      label: translate('tb.fitC'),
      title: translate('tb.fitC'),
    },
  }));

  const activeFitMode = createMemo<FitMode>(
    () => currentFitMode() ?? FIT_MODE_ORDER[0]?.mode ?? 'original'
  );

  // 6. Effects
  createEffect(
    on(isDownloadingProp, (value) => {
      toolbarActions.setDownloading(!!value);
    })
  );

  // 7. Helper functions
  const setSettingsExpanded = (expanded: boolean): void => {
    setSettingsExpandedSignal(expanded);
    if (expanded) {
      setTweetExpanded(false);
    }
  };

  const toggleSettings = (): void => {
    setSettingsExpanded(!settingsExpandedSignal());
  };

  const toggleTweet = (): void => {
    setTweetExpanded((prev) => {
      const next = !prev;
      if (next) {
        setSettingsExpanded(false);
      }
      return next;
    });
  };

  const isToolbarDisabled = (): boolean => !!isDisabled();

  const isFitDisabled = (mode: FitMode): boolean => {
    if (isToolbarDisabled()) {
      return true;
    }

    const handler = fitModeHandlers()[mode];
    if (!handler) {
      return true;
    }

    return activeFitMode() === mode;
  };

  // 8. Event handlers
  const handleFitModeClick =
    (mode: FitMode) =>
    (event: MouseEvent): void => {
      safeEventPreventAll(event);
      if (isToolbarDisabled()) {
        return;
      }

      fitModeHandlers()[mode]?.(event);
    };

  const handlePrevious = createGuardedHandler(
    () => navState().prevDisabled,
    local.handlers.navigation.onPrevious
  );

  const handleNext = createGuardedHandler(
    () => navState().nextDisabled,
    local.handlers.navigation.onNext
  );

  const handleDownloadCurrent = createGuardedHandler(
    () => navState().downloadDisabled,
    local.handlers.download.onDownloadCurrent
  );

  const handleDownloadAll = createGuardedHandler(
    () => navState().downloadDisabled,
    local.handlers.download.onDownloadAll
  );

  const handleClose = (event: MouseEvent): void => {
    safeEventPrevent(event);
    local.handlers.lifecycle.onClose();
  };

  // 9. Settings controller
  const baseSettingsController = useToolbarSettingsController({
    isSettingsExpanded: settingsExpandedSignal,
    setSettingsExpanded,
    toggleSettingsExpanded: toggleSettings,
  });

  const settingsController: ToolbarSettingsControllerResult = {
    ...baseSettingsController,
    handleSettingsClick: (event) => {
      const wasOpen = settingsExpandedSignal();
      baseSettingsController.handleSettingsClick(event);
      if (!wasOpen && settingsExpandedSignal()) {
        local.handlers.lifecycle.onOpenSettings?.();
      }
    },
  };

  // 10. JSX return
  return (
    <ToolbarView
      // Base toolbar props (reactive via Solid JSX transform)
      currentIndex={currentIndex}
      focusedIndex={focusedIndex}
      totalCount={totalCount}
      isDownloading={isDownloadingProp}
      disabled={isDisabled}
      aria-label={domProps['aria-label']}
      aria-describedby={domProps['aria-describedby']}
      role={domProps.role}
      tabIndex={domProps.tabIndex}
      data-testid={domProps['data-testid']}
      onFocus={local.handlers.focus?.onFocus}
      onBlur={local.handlers.focus?.onBlur}
      tweetText={tweetText}
      tweetTextHTML={tweetTextHTML}
      tweetUrl={tweetUrl}
      // Derived toolbar view props
      toolbarClass={toolbarClass}
      toolbarState={toolbarState}
      toolbarDataState={toolbarDataState}
      navState={navState}
      displayedIndex={displayedIndex}
      progressWidth={progressWidth}
      fitModeOrder={FIT_MODE_ORDER}
      fitModeLabels={fitModeLabels}
      activeFitMode={activeFitMode}
      handleFitModeClick={handleFitModeClick}
      isFitDisabled={isFitDisabled}
      onPreviousClick={handlePrevious}
      onNextClick={handleNext}
      onDownloadCurrent={handleDownloadCurrent}
      onDownloadAll={handleDownloadAll}
      onCloseClick={handleClose}
      settingsController={settingsController}
      showSettingsButton={typeof local.handlers.lifecycle.onOpenSettings === 'function'}
      isTweetPanelExpanded={tweetExpanded}
      toggleTweetPanelExpanded={toggleTweet}
    />
  );
}
export const Toolbar = ToolbarContainer;
