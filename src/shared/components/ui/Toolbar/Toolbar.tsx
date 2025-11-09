import type { JSXElement } from '../../../external/vendors';
import { getSolid } from '../../../external/vendors';
import { useToolbarState, useToolbarSettingsController } from '@shared/hooks';
import { getToolbarDataState, getToolbarClassName } from '../../../utils/toolbar-utils';
import { createClassName } from '@shared/utils/component-utils';
import { ArrowsPointingIn, ArrowsRightLeft, ArrowsUpDown, ArrowsPointingOut } from '../Icon';
import type { ToolbarSettingsControllerResult } from '@shared/hooks';
import { ToolbarView } from './ToolbarView';
import type { ToolbarProps, FitMode } from './Toolbar.types';
import { safeEventPreventAll, safeEventPrevent } from '@shared/utils/event-utils';
import styles from './Toolbar.module.css';

const solid = getSolid();
const { mergeProps, createMemo, createEffect, on, createSignal, createComponent } = solid;

const DEFAULT_PROPS = {
  isDownloading: false,
  disabled: false,
  className: '',
} as const;

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

function ToolbarContainer(rawProps: ToolbarProps): JSXElement {
  const props = mergeProps(DEFAULT_PROPS, rawProps);

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

  const displayedIndex = createMemo(() => {
    const total = props.totalCount;
    if (total <= 0) {
      return 0;
    }

    const focus = props.focusedIndex;
    if (typeof focus === 'number' && focus >= 0 && focus < total) {
      return focus;
    }

    return clampIndex(props.currentIndex, total);
  });

  const progressWidth = createMemo(() => {
    const total = props.totalCount;
    if (total <= 0) {
      return '0%';
    }

    return `${((displayedIndex() + 1) / total) * 100}%`;
  });

  const toolbarDataState = createMemo(() => getToolbarDataState(toolbarState));

  const navState = createMemo(() => {
    const total = Math.max(0, props.totalCount);
    const disabled = Boolean(props.disabled);
    const downloadBusy = Boolean(props.isDownloading);

    const navigationDisabled = disabled || total <= 1;
    const downloadDisabled = disabled || downloadBusy;

    return {
      prevDisabled: navigationDisabled,
      nextDisabled: navigationDisabled,
      canDownloadAll: total > 1,
      downloadDisabled,
      anyActionDisabled: navigationDisabled || downloadDisabled,
    } as const;
  });

  const getFitHandler = (mode: FitMode): ToolbarProps['onFitOriginal'] => {
    switch (mode) {
      case 'fitWidth':
        return props.onFitWidth;
      case 'fitHeight':
        return props.onFitHeight;
      case 'fitContainer':
        return props.onFitContainer;
      default:
        return props.onFitOriginal;
    }
  };

  const handleFitModeClick = (mode: FitMode) => (event: MouseEvent) => {
    safeEventPreventAll(event);
    if (!props.disabled) {
      getFitHandler(mode)?.(event);
    }
  };

  const isFitDisabled = (mode: FitMode): boolean => Boolean(props.disabled || !getFitHandler(mode));

  const handlePrevious = (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onPrevious?.();
  };

  const handleNext = (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onNext?.();
  };

  const handleDownloadCurrent = (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onDownloadCurrent?.();
  };

  const handleDownloadAll = (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onDownloadAll?.();
  };

  const handleClose = (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onClose?.();
  };

  return createComponent(ToolbarView, {
    ...props,
    toolbarClass,
    toolbarState,
    toolbarDataState,
    navState,
    displayedIndex,
    progressWidth,
    fitModeOrder: FIT_MODE_ORDER,
    fitModeLabels: FIT_MODE_LABELS,
    handleFitModeClick,
    isFitDisabled,
    onPreviousClick: handlePrevious,
    onNextClick: handleNext,
    onDownloadCurrent: handleDownloadCurrent,
    onDownloadAll: handleDownloadAll,
    onCloseClick: handleClose,
    settingsController,
    showSettingsButton: typeof props.onOpenSettings === 'function',
    isTweetPanelExpanded: tweetExpanded,
    toggleTweetPanelExpanded: toggleTweet,
  });
}

export type { ToolbarProps, FitMode } from './Toolbar.types';
export const Toolbar = ToolbarContainer;
