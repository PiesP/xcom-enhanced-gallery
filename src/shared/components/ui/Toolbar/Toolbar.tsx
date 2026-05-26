// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { LucideIconName } from '@shared/components/ui/Icon/lucide/icon-nodes';
import type {
  FitModeHandlers,
  ImageFitMode,
  ToolbarProps,
} from '@shared/components/ui/Toolbar/Toolbar.types';
import { ToolbarView } from '@shared/components/ui/Toolbar/ToolbarView';
import type { ToolbarSettingsControllerResult } from '@shared/hooks/toolbar/use-toolbar-settings-controller';
import { useToolbarSettingsController } from '@shared/hooks/toolbar/use-toolbar-settings-controller';
import { useToolbarState } from '@shared/hooks/use-toolbar-state';
import { useTranslation } from '@shared/hooks/use-translation';
import type { ToolbarDataState, ToolbarState } from '@shared/types/toolbar.types';
import { clampIndex } from '@shared/utils/types/safety';
import type { JSXElement } from 'solid-js';
import { createEffect, createMemo, createSignal, on, splitProps } from 'solid-js';

import styles from './Toolbar.module.css';

const FIT_MODE_ORDER: ReadonlyArray<{ mode: ImageFitMode; iconName: LucideIconName }> = [
  { mode: 'original', iconName: 'maximize-2' },
  { mode: 'fitWidth', iconName: 'move-horizontal' },
  { mode: 'fitHeight', iconName: 'move-vertical' },
  { mode: 'fitContainer', iconName: 'minimize-2' },
];

type InternalFitModeHandlers = Record<ImageFitMode, FitModeHandlers['onFitOriginal'] | undefined>;

function getToolbarDataState(state: ToolbarState): ToolbarDataState {
  if (state.hasError()) return 'error';
  if (state.isDownloading()) return 'downloading';
  if (state.isLoading()) return 'loading';
  return 'idle';
}

function stopEvent(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
}

export function Toolbar(rawProps: ToolbarProps): JSXElement {
  const [local] = splitProps(rawProps, [
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

  const totalItems = createMemo(() => Math.max(0, local.totalCount() ?? 0));
  const currentIndexForNav = createMemo(() => clampIndex(local.currentIndex() ?? 0, totalItems()));

  const displayedIndex = createMemo(() => {
    const total = totalItems();
    const currentIdx = currentIndexForNav();
    const focusIdx = local.focusedIndex?.() ?? null;
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
    const toolbarDisabled = local.disabled?.() ?? false;
    const downloadBusy = (local.isDownloading?.() ?? false) || toolbarState.isDownloading();
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

  const fitModeLabels = createMemo<Record<ImageFitMode, { label: string; title: string }>>(() => ({
    original: { label: translate('tb.fitOri'), title: translate('tb.fitOri') },
    fitWidth: { label: translate('tb.fitW'), title: translate('tb.fitW') },
    fitHeight: { label: translate('tb.fitH'), title: translate('tb.fitH') },
    fitContainer: { label: translate('tb.fitC'), title: translate('tb.fitC') },
  }));

  const activeFitMode = createMemo<ImageFitMode>(
    () => local.currentFitMode?.() ?? FIT_MODE_ORDER[0]?.mode ?? 'original'
  );

  createEffect(
    on(
      () => local.isDownloading?.() ?? false,
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

  const isToolbarDisabled = () => !!(local.disabled?.() ?? false);

  const isFitDisabled = (mode: ImageFitMode): boolean => {
    if (isToolbarDisabled()) return true;
    const handler = fitModeHandlers()[mode];
    if (!handler) return true;
    return activeFitMode() === mode;
  };

  const handleFitModeClick = (mode: ImageFitMode) => (event: MouseEvent) => {
    stopEvent(event);
    if (!isToolbarDisabled()) fitModeHandlers()[mode]?.(event);
  };

  const guardedClick = (disabled: () => boolean, action?: () => void) => (event: MouseEvent) => {
    stopEvent(event);
    if (!disabled()) action?.();
  };

  const handleClose = (event: MouseEvent) => {
    stopEvent(event);
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
      currentIndex={local.currentIndex() ?? 0}
      focusedIndex={local.focusedIndex?.() ?? null}
      totalCount={local.totalCount() ?? 0}
      isDownloading={local.isDownloading?.() ?? false}
      disabled={local.disabled?.() ?? false}
      currentFitMode={activeFitMode()}
      tweetText={local.tweetText?.() ?? null}
      tweetTextHTML={local.tweetTextHTML?.() ?? null}
      tweetUrl={local.tweetUrl?.() ?? null}
      toolbarClass={toolbarClass}
      toolbarState={toolbarState}
      toolbarDataState={toolbarDataState}
      navState={navState}
      displayedIndex={displayedIndex}
      progressWidth={progressWidth}
      fitModeOrder={FIT_MODE_ORDER}
      fitModeLabels={fitModeLabels()}
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
