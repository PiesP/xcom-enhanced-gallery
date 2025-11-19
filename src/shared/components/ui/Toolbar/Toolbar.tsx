import type { JSXElement } from '@shared/external/vendors';
import { getSolid } from '@shared/external/vendors';
import {
  useToolbarState,
  useToolbarSettingsController,
  type ToolbarSettingsControllerResult,
} from '@shared/hooks';
import { getToolbarDataState, getToolbarClassName } from '@shared/utils/toolbar-utils';
import { createClassName } from '@shared/utils/component-utils';
import { safeEventPreventAll, safeEventPrevent } from '@shared/utils/event-utils';
import {
  ArrowsPointingIn,
  ArrowsPointingOut,
  ArrowsRightLeft,
  ArrowsUpDown,
} from '@shared/components/ui/Icon';
import { ToolbarView } from '@shared/components/ui/Toolbar/ToolbarView';
import type {
  ToolbarProps,
  FitMode,
  MaybeAccessor,
} from '@shared/components/ui/Toolbar/Toolbar.types';
import styles from './Toolbar.module.css';

const solid = getSolid();
const { mergeProps, createMemo, createEffect, on, createSignal } = solid;

const DEFAULT_PROPS = {
  isDownloading: false,
  disabled: false,
  className: '',
} as const;

type Accessor<T> = () => T;

const isAccessor = <T,>(value: MaybeAccessor<T> | undefined): value is Accessor<T> =>
  typeof value === 'function';

const resolveAccessor = <T,>(value: MaybeAccessor<T> | undefined, fallback?: T): T => {
  if (isAccessor(value)) {
    return value();
  }
  return value ?? (fallback as T);
};

const FIT_MODE_LABELS: Record<FitMode, { label: string; title: string }> = {
  original: { label: '원본 크기', title: '원본 크기 (1:1)' },
  fitWidth: { label: '가로에 맞춤', title: '가로에 맞추기' },
  fitHeight: { label: '세로에 맞춤', title: '세로에 맞추기' },
  fitContainer: { label: '창에 맞춤', title: '창에 맞추기' },
};

const FIT_MODE_ORDER = [
  { mode: 'original' as const, Icon: ArrowsPointingOut },
  { mode: 'fitWidth' as const, Icon: ArrowsRightLeft },
  { mode: 'fitHeight' as const, Icon: ArrowsUpDown },
  { mode: 'fitContainer' as const, Icon: ArrowsPointingIn },
] as const;

const HIGH_CONTRAST_LEVELS = [0.25, 0.5, 0.75] as const;

function clampIndex(index: number, total: number): number {
  if (!Number.isFinite(index) || total <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), total - 1);
}

type FitModeHandlers = Record<FitMode, ToolbarProps['onFitOriginal'] | undefined>;

interface NavigationStateParams {
  readonly total: number;
  readonly toolbarDisabled: boolean;
  readonly downloadBusy: boolean;
  readonly currentIndex: number;
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
  currentIndex,
}: NavigationStateParams) => {
  const hasItems = total > 0;
  const prevDisabled = toolbarDisabled || !hasItems || currentIndex <= 0;
  const nextDisabled = toolbarDisabled || !hasItems || currentIndex >= Math.max(total - 1, 0);
  const downloadDisabled = toolbarDisabled || downloadBusy || !hasItems;

  return {
    prevDisabled,
    nextDisabled,
    canDownloadAll: total > 1,
    downloadDisabled,
    anyActionDisabled: toolbarDisabled || downloadBusy,
  } as const;
};

const createGuardedHandler = (
  guard: () => boolean,
  action?: () => void
): ((event: MouseEvent) => void) => {
  return event => {
    safeEventPrevent(event);
    if (guard()) {
      return;
    }
    action?.();
  };
};

function ToolbarContainer(rawProps: ToolbarProps): JSXElement {
  const props = mergeProps(DEFAULT_PROPS, rawProps);

  const currentIndex = () => resolveAccessor(props.currentIndex, 0);
  const totalCount = () => resolveAccessor(props.totalCount, 0);
  const focusedIndex = () => resolveAccessor(props.focusedIndex, null);
  const isDownloading = () => resolveAccessor(props.isDownloading, false);
  const isDisabled = () => resolveAccessor(props.disabled, false);
  const currentFitMode = () => resolveAccessor(props.currentFitMode);
  const tweetText = () => resolveAccessor(props.tweetText);
  const tweetTextHTML = () => resolveAccessor(props.tweetTextHTML);

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
    setTweetExpanded(prev => {
      const next = !prev;
      if (next) {
        setSettingsExpanded(false);
      }
      return next;
    });
  };

  createEffect(
    on(
      () => props.isDownloading,
      value => {
        toolbarActions.setDownloading(Boolean(value));
      }
    )
  );

  createEffect(() => {
    const mode = currentFitMode();
    if (!mode) {
      return;
    }

    toolbarActions.setFitMode(mode);
  });

  const baseSettingsController = useToolbarSettingsController({
    setNeedsHighContrast: toolbarActions.setHighContrast,
    isSettingsExpanded: settingsExpandedSignal,
    setSettingsExpanded,
    toggleSettingsExpanded: toggleSettings,
    highContrastOffsets: HIGH_CONTRAST_LEVELS,
  });

  const settingsController: ToolbarSettingsControllerResult = {
    ...baseSettingsController,
    handleSettingsClick: event => {
      const wasOpen = settingsExpandedSignal();
      baseSettingsController.handleSettingsClick(event);
      if (!wasOpen && settingsExpandedSignal()) {
        props.onOpenSettings?.();
      }
    },
  };

  const toolbarClass = createMemo(() =>
    createClassName(
      styles.toolbar,
      getToolbarClassName(toolbarState, styles.galleryToolbar ?? ''),
      props.className ?? ''
    )
  );
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
      downloadBusy: Boolean(isDownloading()),
      currentIndex: currentIndexForNav(),
    })
  );

  const fitModeHandlers = createMemo<FitModeHandlers>(() => ({
    original: props.onFitOriginal,
    fitWidth: props.onFitWidth,
    fitHeight: props.onFitHeight,
    fitContainer: props.onFitContainer,
  }));

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

    return toolbarState.currentFitMode === mode;
  };

  const handlePrevious = createGuardedHandler(() => navState().prevDisabled, props.onPrevious);
  const handleNext = createGuardedHandler(() => navState().nextDisabled, props.onNext);
  const handleDownloadCurrent = createGuardedHandler(
    () => navState().downloadDisabled,
    props.onDownloadCurrent
  );
  const handleDownloadAll = createGuardedHandler(
    () => navState().downloadDisabled,
    props.onDownloadAll
  );

  const handleClose = (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onClose?.();
  };

  return (
    <ToolbarView
      // Base toolbar props (reactive via Solid JSX transform)
      currentIndex={currentIndex}
      focusedIndex={focusedIndex}
      totalCount={totalCount}
      isDownloading={isDownloading}
      disabled={isDisabled}
      aria-label={props['aria-label']}
      aria-describedby={props['aria-describedby']}
      role={props.role}
      tabIndex={props.tabIndex}
      data-testid={props['data-testid']}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
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
      handleFitModeClick={handleFitModeClick}
      isFitDisabled={isFitDisabled}
      onPreviousClick={handlePrevious}
      onNextClick={handleNext}
      onDownloadCurrent={handleDownloadCurrent}
      onDownloadAll={handleDownloadAll}
      onCloseClick={handleClose}
      settingsController={settingsController}
      showSettingsButton={typeof props.onOpenSettings === 'function'}
      isTweetPanelExpanded={tweetExpanded}
      toggleTweetPanelExpanded={toggleTweet}
    />
  );
}

export type { ToolbarProps, FitMode } from '@shared/components/ui/Toolbar/Toolbar.types';
export const Toolbar = ToolbarContainer;
