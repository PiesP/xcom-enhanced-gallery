// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { SettingsPersistenceNotice } from '@shared/components/ui/Settings/SettingsPersistenceNotice';
import { clearSettings, registerSettings } from '@shared/container/settings-registry';
import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { userEvent } from 'vite-plus/test/browser/context';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const language = vi.hoisted(() => ({
  unsaved: false,
  listeners: new Set<(unsaved: boolean) => void>(),
}));

vi.mock('@shared/services/language-service', () => ({
  getLanguageService: () => ({
    hasUnsavedChanges: () => language.unsaved,
    subscribePersistence: (listener: (unsaved: boolean) => void) => {
      language.listeners.add(listener);
      return () => language.listeners.delete(listener);
    },
  }),
}));
vi.mock('@shared/hooks/use-translation', () => ({
  useTranslation: () => (key: string) => key,
}));

describe('toolbar persistence notice', () => {
  let host: HTMLDivElement;
  let settingsUnsaved = false;
  let settingsListeners: Set<(unsaved: boolean) => void>;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    language.unsaved = false;
    language.listeners.clear();
    settingsUnsaved = false;
    settingsListeners = new Set();
    registerSettings({
      get: () => undefined,
      set: async () => undefined,
      hasUnsavedChanges: () => settingsUnsaved,
      subscribePersistence: (listener) => {
        settingsListeners.add(listener);
        return () => settingsListeners.delete(listener);
      },
    });
  });

  afterEach(() => {
    clearSettings();
    host.remove();
  });

  function mount() {
    const [expanded, setExpanded] = createSignal(false);
    const onOpen = vi.fn((event: MouseEvent) => {
      expect(event.type).toBe('click');
      setExpanded(true);
    });
    const dispose = render(
      () => <SettingsPersistenceNotice expanded={expanded()} onOpen={onOpen} />,
      host
    );
    return { dispose, expanded, setExpanded, onOpen };
  }

  function reportSettings(unsaved: boolean): void {
    settingsUnsaved = unsaved;
    settingsListeners.forEach((listener) => listener(unsaved));
  }

  function reportLanguage(unsaved: boolean): void {
    language.unsaved = unsaved;
    language.listeners.forEach((listener) => listener(unsaved));
  }

  it('shows no failed status for a pending/healthy save and clears after recovery', async () => {
    const ui = mount();
    try {
      expect(host.querySelector('[data-xeg-settings-unsaved-indicator]')).toBeNull();
      reportSettings(true);
      const notice = host.querySelector('[data-xeg-settings-unsaved-indicator]');
      expect(notice?.textContent).toContain('st.unsavedSession');
      const button = notice?.querySelector('button');
      expect(button?.getAttribute('aria-label')).toContain('st.unsavedSession');
      if (!button) {
        throw new Error('Missing Settings recovery entry');
      }
      await userEvent.click(button);
      expect(ui.onOpen).toHaveBeenCalledOnce();
      expect(ui.expanded()).toBe(true);
      expect(host.querySelector('[data-xeg-settings-unsaved-indicator]')).not.toBeNull();
      expect(host.querySelector('[role="status"]')).toBeNull();
      ui.setExpanded(false);
      expect(host.querySelector('[role="status"]')?.textContent).toBe('st.unsavedSession');
      reportSettings(false);
      expect(host.querySelector('[data-xeg-settings-unsaved-indicator]')).toBeNull();
    } finally {
      ui.dispose();
      expect(settingsListeners.size).toBe(0);
      expect(language.listeners.size).toBe(0);
    }
  });

  it('reports a late failure after the panel closes and keeps independent owners separate', () => {
    const ui = mount();
    try {
      ui.setExpanded(true);
      ui.setExpanded(false);
      reportLanguage(true);
      expect(host.querySelector('[role="status"]')?.textContent).toBe('st.unsavedSession');
      reportSettings(true);
      reportLanguage(false);
      expect(host.querySelector('[data-xeg-settings-unsaved-indicator]')).not.toBeNull();
      reportSettings(false);
      expect(host.querySelector('[data-xeg-settings-unsaved-indicator]')).toBeNull();
    } finally {
      ui.dispose();
    }
  });

  it('reads retained state on remount and opens Settings from a native keyboard action', async () => {
    reportSettings(true);
    const first = mount();
    expect(host.querySelector('[data-xeg-settings-unsaved-indicator]')).not.toBeNull();
    first.dispose();
    expect(settingsListeners.size).toBe(0);
    expect(language.listeners.size).toBe(0);
    const second = mount();
    try {
      const button = host.querySelector<HTMLButtonElement>('button');
      if (!button) {
        throw new Error('Missing Settings recovery entry after remount');
      }
      button.focus();
      await userEvent.keyboard('{Enter}');
      expect(second.onOpen).toHaveBeenCalledOnce();
      expect(second.expanded()).toBe(true);
      expect(settingsListeners.size).toBe(1);
      expect(language.listeners.size).toBe(1);
    } finally {
      second.dispose();
      expect(settingsListeners.size).toBe(0);
      expect(language.listeners.size).toBe(0);
    }
  });
});
