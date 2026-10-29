// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { SettingsControls } from '@shared/components/ui/Settings/SettingsControls';
import { clearSettings, registerSettings } from '@shared/container/settings-registry';
import type { SettingChangeEvent, VideoClickMode } from '@shared/types/settings.types';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const notification = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@platform/index', () => ({
  getNotificationAdapter: () => ({}),
  notifySafely: notification.send,
}));
vi.mock('@shared/services/language-service', () => ({
  getLanguageService: () => ({
    translate: (key: string) => key,
    onLanguageChange: () => () => undefined,
    hasUnsavedChanges: () => false,
    subscribePersistence: () => () => undefined,
    retryUnsaved: async () => undefined,
  }),
}));
// Browser trust admission is covered separately; exercise the selected value here.
vi.mock('@shared/utils/events/trusted-event', () => ({
  withTrustedEvent: (handler: (event: Event) => void) => handler,
}));

function mountSettings(initial: VideoClickMode) {
  let current = initial;
  let denied = false;
  let unsaved = false;
  const subscribers = new Set<(event: SettingChangeEvent) => void>();
  const persistenceSubscribers = new Set<(value: boolean) => void>();
  const notify = (
    oldValue: VideoClickMode,
    newValue: VideoClickMode,
    status: 'success' | 'error' = 'success'
  ): void => {
    for (const subscriber of subscribers) {
      subscriber({
        key: 'gallery.videoClickMode',
        oldValue,
        newValue,
        timestamp: Date.now(),
        status,
      });
    }
  };
  const set = vi.fn(async (_key: string, value: unknown) => {
    const previous = current;
    current = value as VideoClickMode;
    notify(previous, current, denied ? 'error' : 'success');
    unsaved = denied;
    for (const subscriber of persistenceSubscribers) {
      subscriber(unsaved);
    }
    if (denied) {
      throw new Error('Storage unavailable');
    }
  });
  const retryUnsaved = vi.fn(async () => {
    if (denied) {
      throw new Error('Storage unavailable');
    }
    unsaved = false;
    for (const subscriber of persistenceSubscribers) {
      subscriber(unsaved);
    }
  });
  registerSettings({
    get: () => current,
    set,
    subscribe: (listener) => {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
    hasUnsavedChanges: () => unsaved,
    subscribePersistence: (listener) => {
      persistenceSubscribers.add(listener);
      return () => persistenceSubscribers.delete(listener);
    },
    retryUnsaved,
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
  if (!select) {
    throw new Error('Missing video click setting');
  }
  return {
    select,
    set,
    retryUnsaved,
    setDenied: (value: boolean) => {
      denied = value;
    },
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

  it('keeps a denied selection active and exposes an explicit retry', async () => {
    const ui = mountSettings('block-controls-only');
    try {
      ui.select.value = 'allow-all';
      ui.select.dispatchEvent(new Event('change', { bubbles: true }));
      await vi.waitFor(() =>
        expect(ui.set).toHaveBeenCalledWith('gallery.videoClickMode', 'allow-all')
      );
      expect(ui.select.value).toBe('allow-all');

      ui.setDenied(true);
      ui.select.value = 'block-all';
      ui.select.dispatchEvent(new Event('change', { bubbles: true }));
      await vi.waitFor(() => expect(notification.send).toHaveBeenCalledOnce());
      expect(ui.select.value).toBe('block-all');
      expect(notification.send).toHaveBeenCalledWith({}, 'msg.err.t', 'st.videoClickSaveError');
      const unsaved = document.querySelector('[data-xeg-settings-unsaved]');
      expect(unsaved).not.toBeNull();
      expect(unsaved?.textContent).toContain('st.unsavedSettings');
      ui.setDenied(false);
      const retry = unsaved?.querySelector('button');
      expect(retry).toBeInstanceOf(HTMLButtonElement);
      retry?.click();
      await vi.waitFor(() => expect(ui.retryUnsaved).toHaveBeenCalledOnce());
      await vi.waitFor(() =>
        expect(document.querySelector('[data-xeg-settings-unsaved]')).toBeNull()
      );
    } finally {
      ui.dispose();
    }
  });
});
