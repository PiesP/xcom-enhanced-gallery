/**
 * @fileoverview ToolbarView reactivity tests
 * @description Ensures accessor-based props trigger UI updates
 */

import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@test/utils/testing-library';
import { getSolid } from '@shared/external/vendors';
import { ToolbarView } from '@shared/components/ui/Toolbar/ToolbarView';
import type { ToolbarViewProps } from '@shared/components/ui/Toolbar/ToolbarView';
import type { ToolbarSettingsControllerResult } from '@shared/hooks';
import type { FitMode, ToolbarState } from '@shared/components/ui/Toolbar';

const solid = getSolid();

const DummyIcon = () => solid.h('span', {});

const FIT_MODE_ORDER: ReadonlyArray<{ mode: FitMode; Icon: typeof DummyIcon }> = [
  { mode: 'original', Icon: DummyIcon },
  { mode: 'fitWidth', Icon: DummyIcon },
  { mode: 'fitHeight', Icon: DummyIcon },
  { mode: 'fitContainer', Icon: DummyIcon },
];

const FIT_MODE_LABELS: Record<FitMode, { label: string; title: string }> = {
  original: { label: '원본', title: '원본' },
  fitWidth: { label: '가로', title: '가로' },
  fitHeight: { label: '세로', title: '세로' },
  fitContainer: { label: '컨테이너', title: '컨테이너' },
};

const TOOLBAR_STATE_STUB: ToolbarState = {
  isDownloading: false,
  isLoading: false,
  hasError: false,
};

const createSettingsController = (): ToolbarSettingsControllerResult => ({
  assignToolbarRef: () => {},
  assignSettingsPanelRef: () => {},
  assignSettingsButtonRef: () => {},
  isSettingsExpanded: () => false,
  currentTheme: () => 'auto',
  currentLanguage: () => 'auto',
  handleSettingsClick: () => {},
  handleSettingsMouseDown: () => {},
  handleToolbarKeyDown: () => {},
  handlePanelMouseDown: () => {},
  handlePanelClick: () => {},
  handleThemeChange: () => {},
  handleLanguageChange: () => {},
});

describe('ToolbarView reactivity', () => {
  it('updates counter attributes when signal-backed props change', async () => {
    const { createSignal } = getSolid();
    const [currentIndex, setCurrentIndex] = createSignal(0);
    const [focusedIndex, setFocusedIndex] = createSignal<number | null>(null);
    const totalCountValue = 5;

    const props: ToolbarViewProps = {
      currentIndex: () => currentIndex(),
      focusedIndex: () => focusedIndex(),
      totalCount: () => totalCountValue,
      isDownloading: () => false,
      disabled: () => false,
      tweetText: undefined,
      tweetTextHTML: undefined,
      toolbarClass: () => 'toolbar',
      toolbarState: TOOLBAR_STATE_STUB,
      toolbarDataState: () => 'idle',
      navState: () => ({
        prevDisabled: currentIndex() <= 0,
        nextDisabled: currentIndex() >= totalCountValue - 1,
        canDownloadAll: totalCountValue > 1,
        downloadDisabled: false,
        anyActionDisabled: false,
      }),
      displayedIndex: () => focusedIndex() ?? currentIndex(),
      progressWidth: () => `${(((focusedIndex() ?? currentIndex()) + 1) / totalCountValue) * 100}%`,
      fitModeOrder: FIT_MODE_ORDER,
      fitModeLabels: FIT_MODE_LABELS,
      activeFitMode: () => 'fitContainer',
      handleFitModeClick: () => () => {},
      isFitDisabled: () => false,
      onPreviousClick: () => {},
      onNextClick: () => {},
      onDownloadCurrent: () => {},
      onDownloadAll: () => {},
      onCloseClick: () => {},
      settingsController: createSettingsController(),
      showSettingsButton: true,
      isTweetPanelExpanded: () => false,
      toggleTweetPanelExpanded: () => {},
      role: 'toolbar',
    };

    const { container } = render(() => solid.createComponent(ToolbarView, props));

    const toolbarRoot = container.querySelector('[data-gallery-element="toolbar"]') as HTMLElement;
    const counter = container.querySelector('[data-gallery-element="counter"]') as HTMLElement;

    expect(toolbarRoot?.dataset.currentIndex).toBe('0');
    expect(counter?.dataset.currentIndex).toBe('0');
    expect(counter?.dataset.focusedIndex).toBe('0');

    setCurrentIndex(2);

    await waitFor(() => {
      expect(toolbarRoot?.dataset.currentIndex).toBe('2');
      expect(counter?.dataset.currentIndex).toBe('2');
    });

    setFocusedIndex(4);

    await waitFor(() => {
      expect(counter?.dataset.focusedIndex).toBe('4');
    });
  });
});
