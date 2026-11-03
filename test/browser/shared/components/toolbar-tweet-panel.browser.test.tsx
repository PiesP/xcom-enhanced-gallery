// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { ToolbarView } from '@shared/components/ui/Toolbar/ToolbarView';
import type { MediaInfo } from '@shared/types/media.types';
import {
  handleKeyboardEvent,
  resetKeyboardDebounceState,
} from '@shared/utils/events/handlers/keyboard';
import {
  closeGallery,
  getDisplayedMediaIndex,
  gallerySignals,
  navigateNext,
  navigatePrevious,
  openGallery,
  setFocusedIndexOnly,
} from '@shared/state/signals/gallery.signals';
import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@shared/hooks/use-translation', () => ({
  useTranslation: () => (key: string) => key,
}));
vi.mock('@shared/services/event-manager', () => ({
  getEventManager: () => ({ addEventListener: vi.fn(), removeByContext: vi.fn() }),
}));
vi.mock('@shared/utils/events/trusted-event', () => ({
  withTrustedEvent: (handler: (event: Event) => void) => handler,
}));

const settingsController = {
  assignToolbarRef: vi.fn(),
  assignSettingsPanelRef: vi.fn(),
  assignSettingsButtonRef: vi.fn(),
  isSettingsExpanded: () => false,
  currentTheme: () => 'auto' as const,
  currentLanguage: () => 'en' as const,
  handleSettingsClick: vi.fn(),
  handleSettingsMouseDown: vi.fn(),
  handleToolbarKeyDown: vi.fn(),
  handlePanelMouseDown: vi.fn(),
  handlePanelClick: vi.fn(),
  handleThemeChange: vi.fn(),
  handleLanguageChange: vi.fn(),
};

const items: MediaInfo[] = [
  {
    id: 'a',
    type: 'image',
    url: 'https://pbs.twimg.com/media/a.jpg',
    tweetText: 'Fallback A',
    tweetTextContent: 'Alpha #north https://example.com/a',
    tweetUrl: 'https://x.com/alpha/status/1',
  },
  {
    id: 'b',
    type: 'image',
    url: 'https://pbs.twimg.com/media/b.jpg',
    tweetText: 'Beta #south https://example.com/b',
    tweetUrl: 'https://x.com/beta/status/2',
  },
];

let dispose: (() => void) | undefined;
let keyHandler: ((event: KeyboardEvent) => void) | undefined;

afterEach(() => {
  if (keyHandler) {
    document.body.removeEventListener('keydown', keyHandler, true);
  }
  keyHandler = undefined;
  dispose?.();
  dispose = undefined;
  closeGallery();
  resetKeyboardDebounceState();
  document.body.replaceChildren();
});

describe('expanded post-text panel attribution', () => {
  it('follows button, keyboard, and scroll focus changes across owners without remounting', () => {
    openGallery(items, 0);
    const root = document.createElement('div');
    document.body.append(root);
    const [expanded, setExpanded] = createSignal(false);
    const downloaded: number[] = [];
    const displayedItem = () => {
      const index = getDisplayedMediaIndex();
      return index === null ? null : items[index];
    };

    dispose = render(
      () => (
        <ToolbarView
          currentIndex={gallerySignals.currentIndex}
          totalCount={items.length}
          disabled={false}
          currentFitMode="original"
          downloadStatus="idle"
          tweetText={displayedItem()?.tweetText ?? null}
          tweetTextContent={displayedItem()?.tweetTextContent ?? null}
          tweetUrl={displayedItem()?.tweetUrl ?? null}
          toolbarClass={() => 'test-toolbar'}
          toolbarDataState={() => 'idle'}
          navState={() => ({
            prevDisabled: getDisplayedMediaIndex() === 0,
            nextDisabled: getDisplayedMediaIndex() === items.length - 1,
            canDownloadAll: true,
            downloadDisabled: false,
            anyActionDisabled: false,
          })}
          displayedIndex={getDisplayedMediaIndex}
          progressWidth={() => '50%'}
          fitModeOrder={[{ mode: 'original', iconName: 'maximize-2' }]}
          fitModeLabels={{
            original: { label: 'Original', title: 'Original' },
            fitWidth: { label: 'Fit Width', title: 'Fit Width' },
            fitHeight: { label: 'Fit Height', title: 'Fit Height' },
            fitContainer: { label: 'Fit Window', title: 'Fit Window' },
          }}
          handleFitModeClick={() => vi.fn()}
          isFitDisabled={() => false}
          onPreviousClick={() => navigatePrevious('click')}
          onNextClick={() => navigateNext('click')}
          onDownloadCurrent={() => downloaded.push(getDisplayedMediaIndex() ?? -1)}
          onDownloadAll={vi.fn()}
          onCloseClick={vi.fn()}
          settingsController={settingsController}
          showSettingsButton={false}
          isTweetPanelExpanded={expanded}
          toggleTweetPanelExpanded={() => setExpanded(!expanded())}
        />
      ),
      root
    );

    keyHandler = (event) =>
      handleKeyboardEvent(
        event,
        { onGalleryClose: vi.fn(), onMediaClick: vi.fn(async () => undefined) },
        {
          enableKeyboard: true,
          enableMediaDetection: true,
          debugMode: false,
          preventBubbling: true,
          context: 'post-text-panel-attribution',
        }
      );
    document.body.addEventListener('keydown', keyHandler, true);

    const opener = root.querySelector<HTMLButtonElement>('#tweet-text-button')!;
    opener.click();
    const panel = root.querySelector<HTMLElement>('#toolbar-tweet-panel')!;
    const sourceLink = () => panel.querySelector<HTMLAnchorElement>('a')!;
    expect(opener.getAttribute('aria-expanded')).toBe('true');
    expect(panel.textContent).toContain('Alpha #north');
    expect(panel.textContent).not.toContain('Fallback A');
    expect(sourceLink().getAttribute('href')).toBe(items[0]?.tweetUrl);
    expect(sourceLink().textContent).toContain('x.com/alpha/status/1');
    expect(panel.querySelector('a[href="https://example.com/a"]')).not.toBeNull();

    sourceLink().focus();
    const originalLink = sourceLink();
    root.querySelector<HTMLButtonElement>('button[aria-label="tb.next"]')!.click();
    expect(root.querySelector('#toolbar-tweet-panel')).toBe(panel);
    expect(opener.getAttribute('aria-expanded')).toBe('true');
    expect(panel.textContent).toContain('Beta #south');
    expect(panel.textContent).not.toContain('Alpha #north');
    expect(sourceLink().getAttribute('href')).toBe(items[1]?.tweetUrl);
    expect(sourceLink().textContent).toContain('x.com/beta/status/2');
    expect(panel.querySelector('a[href="https://example.com/b"]')).not.toBeNull();
    expect(sourceLink()).toBe(originalLink);
    expect(document.activeElement).toBe(originalLink);

    root.querySelector<HTMLButtonElement>('button[aria-label="tb.dl"]')!.click();
    expect(downloaded).toEqual([1]);

    root.querySelector<HTMLButtonElement>('button[aria-label="tb.prev"]')!.focus();
    root
      .querySelector<HTMLButtonElement>('button[aria-label="tb.prev"]')!
      .dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })
      );
    expect(getDisplayedMediaIndex()).toBe(0);
    expect(panel.textContent).toContain('Alpha #north');
    expect(sourceLink().getAttribute('href')).toBe(items[0]?.tweetUrl);

    setFocusedIndexOnly(1);
    expect(gallerySignals.currentIndex).toBe(0);
    expect(panel.textContent).toContain('Beta #south');
    expect(sourceLink().getAttribute('href')).toBe(items[1]?.tweetUrl);
    root.querySelector<HTMLButtonElement>('button[aria-label="tb.dl"]')!.click();
    expect(downloaded).toEqual([1, 1]);

    setFocusedIndexOnly(null);
    expect(panel.textContent).toContain('Alpha #north');
    expect(sourceLink().getAttribute('href')).toBe(items[0]?.tweetUrl);
  });
});
