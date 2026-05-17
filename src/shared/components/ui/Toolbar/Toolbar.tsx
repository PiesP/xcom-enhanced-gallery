import type { LucideIconName } from '@shared/components/ui/Icon/lucide/icon-nodes';
import type {
  FitMode,
  FitModeHandlers,
  ToolbarProps,
} from '@shared/components/ui/Toolbar/Toolbar.types';
import { ToolbarView } from '@shared/components/ui/Toolbar/ToolbarView';
import type { ToolbarSettingsControllerResult } from '@shared/hooks/toolbar/use-toolbar-settings-controller';
import { useToolbarSettingsController } from '@shared/hooks/toolbar/use-toolbar-settings-controller';
import { useToolbarState } from '@shared/hooks/use-toolbar-state';
import { useTranslation } from '@shared/hooks/use-translation';
import type { ToolbarDataState, ToolbarState } from '@shared/types/toolbar.types';
import { clampIndex } from '@shared/utils/types/safety';
import type { Accessor, JSXElement } from 'solid-js';
import { createEffect, createMemo, createSignal, on, splitProps } from 'solid-js';

import styles from './Toolbar.module.css';

const FIT_MODE_ORDER: ReadonlyArray<{ mode: FitMode; iconName: LucideIconName }> = [
  { mode: 'original', iconName: 'maximize-2' },
  { mode: 'fitWidth', iconName: 'move-horizontal' },
  { mode: 'fitHeight', iconName: 'move-vertical' },
  { mode: 'fitContainer', iconName: 'minimize-2' },
];

type InternalFitModeHandlers = Record<FitMode, FitModeHandlers['onFitOriginal'] | undefined>;

function getToolbarDataState(state: ToolbarState): ToolbarDataState {
  if (state.hasError) return 'error';
  if (state.isDownloading) return 'downloading';
  if (state.isLoading) return 'loading';
  return 'idle';
}

/** Helper to read a split prop that may be a plain value or accessor */
function val<T>(v: T | Accessor<T> | undefined | null): T | undefined {
  if (v == null) return undefined;
  return typeof v === 'function' ? (v as Accessor<T>)() : v;
}

export function Toolbar(rawProps: ToolbarProps): JSXElement {
  const [local, domProps] = splitProps(rawProps, [
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

  const translate = useTranslation();
  const [toolbarState, toolbarActions] = useToolbarState();
  const [settingsExpandedSignal, setSettingsExpandedSignal] = createSignal(false);
  const [tweetExpanded, setTweetExpanded] = createSignal(false);

  const totalItems = createMemo(() => Math.max(0, val(local.totalCount) ?? 0));
  const currentIndexForNav = createMemo(() =>
    clampIndex(val(local.currentIndex) ?? 0, totalItems())
  );

  const displayedIndex = createMemo(() => {
    const total = totalItems();
    const currentIdx = currentIndexForNav();
    const focusIdx = val(local.focusedIndex);
    if (total <= 0) return 0;
    if (typeof focusIdx === 'number' && focusIdx >= 0 && focusIdx < total) return focusIdx;
    return currentIdx;
  });

  const progressWidth = createMemo(() => {
    const total = totalItems();
    const idx = displayedIndex();
    return total <= 0 ? '0%' : `${((idx + 1) / total) * 100}%`;
  });

  const toolbarDataState = createMemo(() => getToolbarDataState(toolbarState));

  const navState = createMemo(() => {
    const total = totalItems();
    const hasItems = total > 0;
    const canNavigate = hasItems && total > 1;
    const toolbarDisabled = !!(val(local.disabled) ?? false);
    const downloadBusy = !!(val(local.isDownloading) ?? false) || toolbarState.isDownloading;
    return {
      prevDisabled: toolbarDisabled || !canNavigate,
      nextDisabled: toolbarDisabled || !canNavigate,
      canDownloadAll: total > 1,
      downloadDisabled: toolbarDisabled || downloadBusy || !hasItems,
      anyActionDisabled: toolbarDisabled,
    };
  });

  const fitModeHandlers = createMemo<InternalFitModeHandlers>(() => ({
    original: local.handlers.fitMode?.onFitOriginal,
    fitWidth: local.handlers.fitMode?.onFitWidth,
    fitHeight: local.handlers.fitMode?.onFitHeight,
    fitContainer: local.handlers.fitMode?.onFitContainer,
  }));

  const fitModeLabels = createMemo<Record<FitMode, { label: string; title: string }>>(() => ({
    original: { label: translate('tb.fitOri'), title: translate('tb.fitOri') },
    fitWidth: { label: translate('tb.fitW'), title: translate('tb.fitW') },
    fitHeight: { label: translate('tb.fitH'), title: translate('tb.fitH') },
    fitContainer: { label: translate('tb.fitC'), title: translate('tb.fitC') },
  }));

  const activeFitMode = createMemo<FitMode>(
    () => val(local.currentFitMode) ?? FIT_MODE_ORDER[0]?.mode ?? 'original'
  );

  createEffect(
    on(
      () => val(local.isDownloading) ?? false,
      (value) => toolbarActions.setDownloading(!!value)
    )
  );

  const setSettingsExpanded = (expanded: boolean) => {
    setSettingsExpandedSignal(expanded);
    if (expanded) setTweetExpanded(false);
  };

  const toggleSettings = () => setSettingsExpanded(!settingsExpandedSignal());

  const toggleTweet = () => {
    setTweetExpanded((prev) => {
      if (!prev) setSettingsExpanded(false);
      return !prev;
    });
  };

  const isToolbarDisabled = () => !!(val(local.disabled) ?? false);

  const isFitDisabled = (mode: FitMode): boolean => {
    if (isToolbarDisabled()) return true;
    const handler = fitModeHandlers()[mode];
    if (!handler) return true;
    return activeFitMode() === mode;
  };

  const handleFitModeClick = (mode: FitMode) => (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (!isToolbarDisabled()) {
      fitModeHandlers()[mode]?.(event);
    }
  };

  const guardedClick = (disabled: () => boolean, action?: () => void) => (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled()) return;
    action?.();
  };

  const handleClose = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    local.handlers.lifecycle.onClose();
  };

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

  const toolbarClass = createMemo(() => {
    const cls = [styles.toolbar, styles.galleryToolbar];
    if (local.className) cls.push(local.className);
    return cls.join(' ');
  });

  return (
    <ToolbarView
      currentIndex={val(local.currentIndex) ?? 0}
      focusedIndex={(val(local.focusedIndex) ?? null) as number | null}
      totalCount={val(local.totalCount) ?? 0}
      isDownloading={val(local.isDownloading) ?? false}
      disabled={val(local.disabled) ?? false}
      aria-label={domProps['aria-label']}
      aria-describedby={domProps['aria-describedby']}
      role={domProps.role}
      tabIndex={domProps.tabIndex}
      data-testid={domProps['data-testid']}
      onFocus={local.handlers.focus?.onFocus}
      onBlur={local.handlers.focus?.onBlur}
      tweetText={val(local.tweetText) ?? null}
      tweetTextHTML={val(local.tweetTextHTML) ?? null}
      tweetUrl={val(local.tweetUrl) ?? null}
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
      onPreviousClick={guardedClick(
        () => navState().prevDisabled,
        local.handlers.navigation.onPrevious
      )}
      onNextClick={guardedClick(() => navState().nextDisabled, local.handlers.navigation.onNext)}
      onDownloadCurrent={guardedClick(
        () => navState().downloadDisabled,
        local.handlers.download.onDownloadCurrent
      )}
      onDownloadAll={guardedClick(
        () => navState().downloadDisabled,
        local.handlers.download.onDownloadAll
      )}
      onCloseClick={handleClose}
      settingsController={settingsController}
      showSettingsButton={typeof local.handlers.lifecycle.onOpenSettings === 'function'}
      isTweetPanelExpanded={tweetExpanded}
      toggleTweetPanelExpanded={toggleTweet}
    />
  );
}
