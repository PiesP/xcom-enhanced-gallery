import {
  ArrowsPointingIn,
  ArrowsPointingOut,
  ArrowsRightLeft,
  ArrowsUpDown,
} from '@shared/components/ui/Icon';
import type {
  FitMode,
  FitModeHandlers,
  ToolbarProps,
} from '@shared/components/ui/Toolbar/Toolbar.types';
import { ToolbarView } from '@shared/components/ui/Toolbar/ToolbarView';
import type { JSXElement } from '@shared/external/vendors';
import {
  type ToolbarSettingsControllerResult,
  useToolbarSettingsController,
  useToolbarState,
} from '@shared/hooks';
import type { ToolbarDataState, ToolbarState } from '@shared/types/toolbar.types';
import { safeEventPrevent, safeEventPreventAll } from '@shared/utils/events/utils';
import { toOptionalAccessor, toRequiredAccessor } from '@shared/utils/solid/solid-helpers';
import { cx } from '@shared/utils/text/formatting';
import { clampIndex } from '@shared/utils/types/safety';
import { createEffect, createMemo, createSignal, mergeProps, on } from 'solid-js';
import styles from './Toolbar.module.css';

const DEFAULT_PROPS = {
  isDownloading: false,
  disabled: false,
  className: '',
} as const;

const FIT_MODE_LABELS: Record<FitMode, { label: string; title: string }> = {
  original: { label: 'Original', title: 'Original Size (1:1)' },
  fitWidth: { label: 'Fit Width', title: 'Fit to Width' },
  fitHeight: { label: 'Fit Height', title: 'Fit to Height' },
  fitContainer: { label: 'Fit Window', title: 'Fit to Window' },
};

const FIT_MODE_ORDER = [
  { mode: 'original' as const, Icon: ArrowsPointingOut },
  { mode: 'fitWidth' as const, Icon: ArrowsRightLeft },
  { mode: 'fitHeight' as const, Icon: ArrowsUpDown },
  { mode: 'fitContainer' as const, Icon: ArrowsPointingIn },
] as const;

/**
 * Internal fit mode handler mapping type for the toolbar view
 */
type InternalFitModeHandlers = Record<FitMode, FitModeHandlers['onFitOriginal'] | undefined>;

interface NavigationStateParams {
  readonly total: number;
  readonly toolbarDisabled: boolean;
  readonly downloadBusy: boolean;
}

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

const calculateProgressWidth = (index: number, total: number): string => {
  if (total <= 0) {
    return '0%';
  }

  return `${((index + 1) / total) * 100}%`;
};

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

const createGuardedHandler = (
  guard: () => boolean,
  action?: () => void,
): (event: MouseEvent) => void => {
  return (event) => {
    safeEventPrevent(event);
    if (guard()) {
      return;
    }
    action?.();
  };
};

function getToolbarDataState(state: ToolbarState): ToolbarDataState {
  if (state.hasError) return 'error';
  if (state.isDownloading) return 'downloading';
  if (state.isLoading) return 'loading';
  return 'idle';
}

function ToolbarContainer(rawProps: ToolbarProps): JSXElement {
  const props = mergeProps(DEFAULT_PROPS, rawProps);

  const currentIndex = toRequiredAccessor(() => props.currentIndex, 0);
  const totalCount = toRequiredAccessor(() => props.totalCount, 0);
  const focusedIndex = toRequiredAccessor(() => props.focusedIndex, null);
  const isDownloadingProp = toRequiredAccessor(() => props.isDownloading, false);
  const isDisabled = toRequiredAccessor(() => props.disabled, false);
  const currentFitMode = toOptionalAccessor(() => props.currentFitMode);
  const tweetText = toOptionalAccessor(() => props.tweetText);
  const tweetTextHTML = toOptionalAccessor(() => props.tweetTextHTML);

  const [toolbarState, toolbarActions] = useToolbarState();
  const [settingsExpandedSignal, setSettingsExpandedSignal] = createSignal(false);
  const [tweetExpanded, setTweetExpanded] = createSignal(false);

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

  createEffect(
    on(isDownloadingProp, (value) => {
      toolbarActions.setDownloading(Boolean(value));
    }),
  );

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
        props.handlers.lifecycle.onOpenSettings?.();
      }
    },
  };

  const toolbarClass = createMemo(() => cx(styles.toolbar, styles.galleryToolbar, props.className));
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
      toolbarDisabled: Boolean(isDisabled()),
      downloadBusy: Boolean(isDownloadingProp() || toolbarState.isDownloading),
    })
  );

  const fitModeHandlers = createMemo<InternalFitModeHandlers>(() => ({
    original: props.handlers.fitMode?.onFitOriginal,
    fitWidth: props.handlers.fitMode?.onFitWidth,
    fitHeight: props.handlers.fitMode?.onFitHeight,
    fitContainer: props.handlers.fitMode?.onFitContainer,
  }));

  const activeFitMode = createMemo<FitMode>(
    () => currentFitMode() ?? FIT_MODE_ORDER[0]?.mode ?? 'original',
  );

  const isToolbarDisabled = () => Boolean(isDisabled());

  const handleFitModeClick = (mode: FitMode) => (event: MouseEvent) => {
    safeEventPreventAll(event);
    if (isToolbarDisabled()) {
      return;
    }

    fitModeHandlers()[mode]?.(event);
  };

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

  const handlePrevious = createGuardedHandler(
    () => navState().prevDisabled,
    props.handlers.navigation.onPrevious,
  );
  const handleNext = createGuardedHandler(
    () => navState().nextDisabled,
    props.handlers.navigation.onNext,
  );
  const handleDownloadCurrent = createGuardedHandler(
    () => navState().downloadDisabled,
    props.handlers.download.onDownloadCurrent,
  );
  const handleDownloadAll = createGuardedHandler(
    () => navState().downloadDisabled,
    props.handlers.download.onDownloadAll,
  );

  const handleClose = (event: MouseEvent) => {
    safeEventPrevent(event);
    props.handlers.lifecycle.onClose();
  };

  return (
    <ToolbarView
      // Base toolbar props (reactive via Solid JSX transform)
      currentIndex={currentIndex}
      focusedIndex={focusedIndex}
      totalCount={totalCount}
      isDownloading={isDownloadingProp}
      disabled={isDisabled}
      aria-label={props['aria-label']}
      aria-describedby={props['aria-describedby']}
      role={props.role}
      tabIndex={props.tabIndex}
      data-testid={props['data-testid']}
      onFocus={props.handlers.focus?.onFocus}
      onBlur={props.handlers.focus?.onBlur}
      tweetText={tweetText}
      tweetTextHTML={tweetTextHTML}
      // Derived toolbar view props
      toolbarClass={toolbarClass}
      toolbarState={toolbarState}
      toolbarDataState={toolbarDataState}
      navState={navState}
      displayedIndex={displayedIndex}
      progressWidth={progressWidth}
      fitModeOrder={FIT_MODE_ORDER}
      fitModeLabels={FIT_MODE_LABELS}
      activeFitMode={activeFitMode}
      handleFitModeClick={handleFitModeClick}
      isFitDisabled={isFitDisabled}
      onPreviousClick={handlePrevious}
      onNextClick={handleNext}
      onDownloadCurrent={handleDownloadCurrent}
      onDownloadAll={handleDownloadAll}
      onCloseClick={handleClose}
      settingsController={settingsController}
      showSettingsButton={typeof props.handlers.lifecycle.onOpenSettings === 'function'}
      isTweetPanelExpanded={tweetExpanded}
      toggleTweetPanelExpanded={toggleTweet}
    />
  );
}

export type { FitMode, ToolbarProps } from '@shared/components/ui/Toolbar/Toolbar.types';
export const Toolbar = ToolbarContainer;
