// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { ToolbarView } from '@shared/components/ui/Toolbar/ToolbarView';
import type { ImageFitMode } from '@shared/types/settings.types';
import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@shared/hooks/use-translation', () => ({
  useTranslation: () => (key: string, params?: Record<string, string | number>) => {
    if (key === 'tb.mediaPosition') return `Media ${params?.index} of ${params?.total}`;
    if (key === 'tb.noMedia') return 'No media';
    if (key === 'tb.currentFit') return `Fit: ${params?.mode}`;
    return key;
  },
}));

vi.mock('@shared/services/event-manager', () => ({
  getEventManager: () => ({ addEventListener: vi.fn(), removeByContext: vi.fn() }),
}));

const fitModeLabels = {
  original: { label: 'Original', title: 'Original' },
  fitWidth: { label: 'Fit Width', title: 'Fit Width' },
  fitHeight: { label: 'Fit Height', title: 'Fit Height' },
  fitContainer: { label: 'Fit Window', title: 'Fit Window' },
};

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

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
});

describe('toolbar collection position and effective fit', () => {
  it('describes empty, single, first, and last positions without progress semantics or live updates', () => {
    const [total, setTotal] = createSignal(0);
    const [index, setIndex] = createSignal<number | null>(null);
    const [fit, setFit] = createSignal<ImageFitMode>('fitWidth');
    const root = document.createElement('div');
    document.body.append(root);
    dispose = render(
      () => (
        <ToolbarView
          currentIndex={0}
          totalCount={total()}
          disabled={false}
          currentFitMode={fit()}
          downloadStatus="idle"
          tweetText={null}
          tweetTextContent={null}
          tweetUrl={null}
          toolbarClass={() => 'test-toolbar'}
          toolbarDataState={() => 'idle'}
          navState={() => ({
            prevDisabled: index() === null || index() === 0,
            nextDisabled: index() === null || index() === total() - 1,
            canDownloadAll: total() > 1,
            downloadDisabled: index() === null,
            anyActionDisabled: false,
          })}
          displayedIndex={index}
          progressWidth={() => index() === null ? '0%' : `${((index()! + 1) / total()) * 100}%`}
          fitModeOrder={[
            { mode: 'original', iconName: 'maximize-2' },
            { mode: 'fitWidth', iconName: 'move-horizontal' },
            { mode: 'fitHeight', iconName: 'move-vertical' },
            { mode: 'fitContainer', iconName: 'minimize-2' },
          ]}
          fitModeLabels={fitModeLabels}
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
        />
      ),
      root
    );

    const counter = root.querySelector('#xeg-toolbar-counter');
    const toolbar = root.querySelector('[data-gallery-element="toolbar"]');
    expect(counter?.textContent).toContain('No media');
    expect(counter?.textContent).not.toContain('/0');
    expect(counter?.getAttribute('data-position')).toBe('0');
    expect(counter?.hasAttribute('aria-live')).toBe(false);
    expect(root.querySelector('[role="progressbar"]')).toBeNull();
    expect(root.querySelector('button[aria-label="tb.dl"]')?.hasAttribute('disabled')).toBe(true);

    setTotal(1);
    setIndex(0);
    expect(counter?.textContent).toContain('Media 1 of 1');
    expect(counter?.getAttribute('data-position')).toBe('1');
    expect(root.querySelector('button[aria-label="tb.prev"]')?.hasAttribute('disabled')).toBe(true);
    expect(root.querySelector('button[aria-label="tb.next"]')?.hasAttribute('disabled')).toBe(true);

    setTotal(4);
    expect(counter?.textContent).toContain('Media 1 of 4');
    setIndex(3);
    expect(counter?.textContent).toContain('Media 4 of 4');
    expect(root.querySelector('button[aria-label="tb.next"]')?.hasAttribute('disabled')).toBe(true);
    expect(toolbar?.textContent).toContain('Fit: Fit Width');
    setFit('fitContainer');
    expect(toolbar?.textContent).toContain('Fit: Fit Window');
    expect(root.querySelector('button[aria-label="Fit Window"]')?.getAttribute('aria-pressed')).toBe('true');
  });
});
