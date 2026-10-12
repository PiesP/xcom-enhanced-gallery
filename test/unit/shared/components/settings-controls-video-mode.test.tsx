// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { SettingsControls } from '@shared/components/ui/Settings/SettingsControls';
import { clearSettings, registerSettings } from '@shared/container/settings-registry';
import type { SettingChangeEvent, VideoClickMode } from '@shared/types/settings.types';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';

const notification = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@platform/index', () => ({
  getNotificationAdapter: () => ({}),
  notifySafely: notification.send,
}));
vi.mock('@shared/services/language-service', () => ({
  getLanguageService: () => ({
    translate: (key: string) => key,
    onLanguageChange: () => () => undefined,
  }),
}));
// Browser trust admission is covered separately; exercise the selected value here.
vi.mock('@shared/utils/events/trusted-event', () => ({
  withTrustedEvent: (handler: (event: Event) => void) => handler,
}));

function mountSettings(initial: VideoClickMode) {
  let current = initial;
  const subscribers = new Set<(event: SettingChangeEvent) => void>();
  const notify = (oldValue: VideoClickMode, newValue: VideoClickMode): void => {
    for (const subscriber of subscribers) {
      subscriber({
        key: 'gallery.videoClickMode',
        oldValue,
        newValue,
        timestamp: Date.now(),
        status: 'success',
      });
    }
  };
  const set = vi.fn(async (_key: string, value: unknown) => {
    const previous = current;
    current = value as VideoClickMode;
    notify(previous, current);
  });
  registerSettings({
    get: () => current,
    set,
    subscribe: (listener) => {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
  });
  const host = document.createElement('div');
  document.body.append(host);
  const dispose = render(
    () => (
      <SettingsControls
        currentTheme="auto"
        currentLanguage="en"
        onThemeChange={() => undefined}
        onLanguageChange={() => undefined}
        data-testid="settings-controls"
      />
    ),
    host
  );
  const select = host.querySelector<HTMLSelectElement>('#settings-controls-video-click-select');
  if (!select) throw new Error('Missing video click setting');
  return {
    select,
    set,
    subscribers,
    updateExternally: (mode: VideoClickMode) => {
      const previous = current;
      current = mode;
      notify(previous, current);
    },
    dispose: () => {
      dispose();
      host.remove();
    },
  };
}

describe('video click setting control', () => {
  afterEach(() => {
    clearSettings();
    notification.send.mockReset();
    document.body.replaceChildren();
  });

  it('shows the current mode and follows external setting changes', () => {
    const ui = mountSettings('block-controls-only');
    try {
      expect(ui.select.value).toBe('block-controls-only');
      expect(Array.from(ui.select.options, (option) => option.value)).toEqual([
        'block-all',
        'block-controls-only',
        'allow-all',
      ]);
      expect(ui.select.getAttribute('aria-describedby')).toBe('settings-controls-video-click-help');
      expect(document.getElementById('settings-controls-video-click-help')?.textContent).toBe(
        'st.videoClickHelp'
      );
      ui.updateExternally('block-all');
      expect(ui.select.value).toBe('block-all');
    } finally {
      ui.dispose();
      expect(ui.subscribers.size).toBe(0);
    }
  });

  it('persists a selected mode and restores the active mode after a failed save', async () => {
    const ui = mountSettings('block-controls-only');
    try {
      ui.select.value = 'allow-all';
      ui.select.dispatchEvent(new Event('change', { bubbles: true }));
      await vi.waitFor(() => expect(ui.set).toHaveBeenCalledWith('gallery.videoClickMode', 'allow-all'));
      expect(ui.select.value).toBe('allow-all');

      ui.set.mockRejectedValueOnce(new Error('Storage unavailable'));
      ui.select.value = 'block-all';
      ui.select.dispatchEvent(new Event('change', { bubbles: true }));
      await vi.waitFor(() => expect(notification.send).toHaveBeenCalledOnce());
      expect(ui.select.value).toBe('allow-all');
      expect(notification.send).toHaveBeenCalledWith({}, 'msg.err.t', 'st.videoClickSaveError');
    } finally {
      ui.dispose();
    }
  });
});
