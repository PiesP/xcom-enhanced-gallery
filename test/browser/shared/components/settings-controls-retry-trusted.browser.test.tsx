// SPDX-License-Identifier: MIT

import { SettingsControls } from '@shared/components/ui/Settings/SettingsControls';
import { clearSettings, registerSettings } from '@shared/container/settings-registry';
import { render } from 'solid-js/web';
import { userEvent } from 'vite-plus/test/browser/context';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const languagePersistence = vi.hoisted(() => ({
  unsaved: false,
  retry: vi.fn(async () => undefined),
}));

vi.mock('@shared/services/language-service', () => ({
  getLanguageService: () => ({
    translate: (key: string) => key,
    onLanguageChange: () => () => undefined,
    hasUnsavedChanges: () => languagePersistence.unsaved,
    subscribePersistence: () => () => undefined,
    retryUnsaved: languagePersistence.retry,
  }),
}));

describe('settings retry DOM input', () => {
  beforeEach(() => {
    languagePersistence.unsaved = false;
    languagePersistence.retry.mockReset().mockResolvedValue(undefined);
  });
  it('accepts pointer and keyboard input but ignores synthetic clicks and a pending attempt', async () => {
    let finishRetry: (() => void) | undefined;
    const retryUnsaved = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishRetry = resolve;
        })
    );
    registerSettings({
      get: () => undefined,
      set: vi.fn(async () => undefined),
      hasUnsavedChanges: () => true,
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
        />
      ),
      host
    );
    try {
      const retry = host.querySelector<HTMLButtonElement>('[data-xeg-settings-unsaved] button');
      if (!retry) {
        throw new Error('Missing settings retry button');
      }
      retry.click();
      retry.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(retryUnsaved).not.toHaveBeenCalled();

      await userEvent.click(retry);
      expect(retryUnsaved).toHaveBeenCalledOnce();
      expect(languagePersistence.retry).toHaveBeenCalledOnce();
      expect(retry.disabled).toBe(true);
      retry.click();
      expect(retryUnsaved).toHaveBeenCalledOnce();

      finishRetry?.();
      await vi.waitFor(() => expect(retry.disabled).toBe(false));
      retry.focus();
      await userEvent.keyboard('{Enter}');
      expect(retryUnsaved).toHaveBeenCalledTimes(2);
      finishRetry?.();
    } finally {
      dispose();
      host.remove();
      clearSettings();
    }
  });
  it('shows language-only failures and retries when gallery settings are unavailable', async () => {
    clearSettings();
    languagePersistence.unsaved = true;
    const host = document.createElement('div');
    document.body.append(host);
    const dispose = render(
      () => (
        <SettingsControls
          currentTheme="auto"
          currentLanguage="ko"
          onThemeChange={() => undefined}
          onLanguageChange={() => undefined}
        />
      ),
      host
    );
    try {
      const button = host.querySelector<HTMLButtonElement>('[data-xeg-settings-unsaved] button');
      expect(button).not.toBeNull();
      if (button) {
        await userEvent.click(button);
      }
      expect(languagePersistence.retry).toHaveBeenCalledOnce();
    } finally {
      dispose();
      host.remove();
    }
  });
});
