/**
 * @fileoverview Toolbar 스크롤 가드 동작 테스트
 * @description 툴바 및 패널 영역에서 휠 스크롤 시 배경 페이지가 스크롤되지 않도록 막는지 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@test/utils/testing-library';
import { getSolid } from '@shared/external/vendors';
import { ToolbarView } from '@shared/components/ui/Toolbar/ToolbarView';
import type { ToolbarViewProps } from '@shared/components/ui/Toolbar/ToolbarView';
import type { ToolbarSettingsControllerResult } from '@shared/hooks';
import type { FitMode, ToolbarState } from '@shared/components/ui/Toolbar';

const solid = getSolid();

const noop = () => {};

const DummyIcon = () => solid.h('span', {});

const FIT_MODE_ORDER_STUB = [
  { mode: 'original' as const, Icon: DummyIcon },
  { mode: 'fitWidth' as const, Icon: DummyIcon },
  { mode: 'fitHeight' as const, Icon: DummyIcon },
  { mode: 'fitContainer' as const, Icon: DummyIcon },
];

const FIT_MODE_LABELS_STUB: Record<FitMode, { label: string; title: string }> = {
  original: { label: '원본', title: '원본' },
  fitWidth: { label: '가로', title: '가로' },
  fitHeight: { label: '세로', title: '세로' },
  fitContainer: { label: '컨테이너', title: '컨테이너' },
};

const TOOLBAR_STATE_STUB: ToolbarState = {
  isDownloading: false,
  isLoading: false,
  hasError: false,
  currentFitMode: 'fitContainer',
  needsHighContrast: false,
};

const NAV_STATE_STUB = {
  prevDisabled: true,
  nextDisabled: true,
  canDownloadAll: false,
  downloadDisabled: false,
  anyActionDisabled: false,
} as const;

interface ToolbarViewOptions {
  readonly settingsExpanded?: boolean;
  readonly tweetExpanded?: boolean;
  readonly tweetText?: string;
  readonly tweetTextHTML?: string;
}

const createSettingsController = (expanded: boolean): ToolbarSettingsControllerResult => ({
  assignToolbarRef: noop,
  assignSettingsPanelRef: noop,
  assignSettingsButtonRef: noop,
  isSettingsExpanded: () => expanded,
  currentTheme: () => 'auto',
  currentLanguage: () => 'auto',
  handleSettingsClick: noop,
  handleSettingsMouseDown: noop,
  handleToolbarKeyDown: noop,
  handlePanelMouseDown: noop,
  handlePanelClick: noop,
  handleThemeChange: noop,
  handleLanguageChange: noop,
});

const createToolbarViewProps = (options: ToolbarViewOptions = {}): ToolbarViewProps => {
  const settingsExpanded = options.settingsExpanded ?? false;
  const tweetExpanded = options.tweetExpanded ?? false;

  return {
    currentIndex: 0,
    totalCount: 1,
    focusedIndex: 0,
    isDownloading: false,
    disabled: false,
    tweetText: options.tweetText,
    tweetTextHTML: options.tweetTextHTML,
    toolbarClass: () => 'toolbar',
    toolbarState: TOOLBAR_STATE_STUB,
    toolbarDataState: () => 'idle',
    navState: () => NAV_STATE_STUB,
    displayedIndex: () => 0,
    progressWidth: () => '100%',
    fitModeOrder: FIT_MODE_ORDER_STUB,
    fitModeLabels: FIT_MODE_LABELS_STUB,
    handleFitModeClick: () => () => {},
    isFitDisabled: () => false,
    onPreviousClick: noop,
    onNextClick: noop,
    onDownloadCurrent: noop,
    onDownloadAll: noop,
    onCloseClick: noop,
    settingsController: createSettingsController(settingsExpanded),
    showSettingsButton: true,
    isTweetPanelExpanded: () => tweetExpanded,
    toggleTweetPanelExpanded: noop,
    role: 'toolbar',
  } satisfies ToolbarViewProps;
};

describe('Toolbar – wheel scroll guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const waitForElement = async (selector: string, root: HTMLElement): Promise<HTMLElement> => {
    let element: HTMLElement | null = null;
    await waitFor(() => {
      element = root.querySelector(selector) as HTMLElement | null;
      expect(element, `${selector} should exist`).not.toBeNull();
    });
    return element!;
  };

  it('휠 이벤트가 툴바 영역에서 기본 스크롤을 차단해야 함', async () => {
    const { container } = render(() =>
      solid.createComponent(ToolbarView, createToolbarViewProps())
    );

    const toolbarRoot = await waitForElement('[data-gallery-element="toolbar"]', container);

    const wheelEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120 });
    toolbarRoot.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(true);
  });

  it('휠 이벤트가 설정 패널에서도 배경 스크롤을 막아야 함', async () => {
    const { container } = render(() =>
      solid.createComponent(ToolbarView, createToolbarViewProps({ settingsExpanded: true }))
    );

    const settingsPanel = await waitForElement(
      '[data-gallery-element="settings-panel"]',
      container
    );
    expect(settingsPanel.dataset.expanded).toBe('true');

    const wheelEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -80 });
    settingsPanel.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(true);
  });

  it('스크롤 가능한 트윗 패널 콘텐츠에서는 휠 이벤트를 허용해야 함', async () => {
    const longTweet = Array.from({ length: 40 })
      .map((_, index) => `tweet line ${index}`)
      .join(' ');

    const { container } = render(() =>
      solid.createComponent(
        ToolbarView,
        createToolbarViewProps({ tweetExpanded: true, tweetText: longTweet })
      )
    );

    const tweetPanel = await waitForElement('[data-gallery-element="tweet-panel"]', container);
    expect(tweetPanel.dataset.expanded).toBe('true');

    const tweetContent = await waitForElement('[data-gallery-element="tweet-content"]', container);

    Object.defineProperty(tweetContent, 'scrollHeight', {
      configurable: true,
      get: () => 400,
    });
    Object.defineProperty(tweetContent, 'clientHeight', {
      configurable: true,
      get: () => 200,
    });
    tweetContent.scrollTop = 50;

    const wheelEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 60 });
    tweetContent.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(false);
  });

  it('스크롤할 수 없는 트윗 패널 콘텐츠에서는 배경 스크롤을 차단해야 함', async () => {
    const { container } = render(() =>
      solid.createComponent(
        ToolbarView,
        createToolbarViewProps({ tweetExpanded: true, tweetText: 'short tweet' })
      )
    );

    const tweetPanel = await waitForElement('[data-gallery-element="tweet-panel"]', container);
    expect(tweetPanel.dataset.expanded).toBe('true');

    const tweetContent = await waitForElement('[data-gallery-element="tweet-content"]', container);

    Object.defineProperty(tweetContent, 'scrollHeight', {
      configurable: true,
      get: () => 200,
    });
    Object.defineProperty(tweetContent, 'clientHeight', {
      configurable: true,
      get: () => 200,
    });
    tweetContent.scrollTop = 0;

    const wheelEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120 });
    tweetContent.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(true);
  });
});
