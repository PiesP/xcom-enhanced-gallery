// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { ToolbarView } from '@shared/components/ui/Toolbar/ToolbarView';
import { KEYBOARD_HELP_REQUEST } from '@shared/utils/events/handlers/keyboard-help-event';
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

function mountHelp() {
  const root = document.createElement('div');
  document.body.append(root);
  const onOpenHelp = vi.fn();
  const dispose = render(
    () => (
      <ToolbarView
        currentIndex={0}
        totalCount={1}
        disabled={false}
        currentFitMode="original"
        downloadStatus="idle"
        tweetText={null}
        tweetTextContent={null}
        tweetUrl={null}
        toolbarClass={() => 'test-toolbar'}
        toolbarDataState={() => 'idle'}
        navState={() => ({
          prevDisabled: true,
          nextDisabled: true,
          canDownloadAll: false,
          downloadDisabled: false,
          anyActionDisabled: false,
        })}
        displayedIndex={() => 0}
        progressWidth={() => '100%'}
        fitModeOrder={[{ mode: 'original', iconName: 'maximize-2' }]}
        fitModeLabels={{
          original: { label: 'Original', title: 'Original' },
          fitWidth: { label: 'Fit Width', title: 'Fit Width' },
          fitHeight: { label: 'Fit Height', title: 'Fit Height' },
          fitContainer: { label: 'Fit Window', title: 'Fit Window' },
        }}
        handleFitModeClick={() => vi.fn()}
        isFitDisabled={() => false}
        onPreviousClick={vi.fn()}
        onNextClick={vi.fn()}
        onDownloadCurrent={vi.fn()}
        onDownloadAll={vi.fn()}
        onCloseClick={vi.fn()}
        settingsController={settingsController}
        showSettingsButton={false}
        isTweetPanelExpanded={() => false}
        toggleTweetPanelExpanded={vi.fn()}
        onOpenHelp={onOpenHelp}
      />
    ),
    root
  );
  return { root, dispose, onOpenHelp };
}

const disposers: Array<() => void> = [];
afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.replaceChildren();
});

describe('persistent toolbar keyboard help', () => {
  it('opens from the visible button, keeps the key map present, and restores focus after Escape', async () => {
    const ui = mountHelp();
    disposers.push(ui.dispose);
    const opener = ui.root.querySelector<HTMLButtonElement>('#keyboard-help-button');
    expect(opener).not.toBeNull();
    opener?.focus();
    opener?.click();
    await Promise.resolve();
    const panel = ui.root.querySelector<HTMLElement>('#toolbar-keyboard-help-panel');
    const closer = panel?.querySelector<HTMLButtonElement>('button');
    expect(opener?.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.textContent).toContain('msg.kb.firstLast');
    expect(panel?.textContent).toContain('msg.kb.recovery');
    expect(document.activeElement).toBe(closer);
    closer?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(opener?.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(opener);
    expect(ui.onOpenHelp).toHaveBeenCalledOnce();
  });

  it('opens the same panel from the eligible keyboard request', async () => {
    const ui = mountHelp();
    disposers.push(ui.dispose);
    document.body.dispatchEvent(new Event(KEYBOARD_HELP_REQUEST));
    await Promise.resolve();
    expect(ui.root.querySelector('#keyboard-help-button')?.getAttribute('aria-expanded')).toBe(
      'true'
    );
    expect(ui.root.querySelector('#toolbar-keyboard-help-panel')?.textContent).toContain(
      'msg.kb.playback'
    );
  });
});
