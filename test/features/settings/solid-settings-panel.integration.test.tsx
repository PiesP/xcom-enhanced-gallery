import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitFor } from '@test-utils/testing-library';
import { renderSolidSettingsPanel } from '@/features/settings/solid/renderSolidSettingsPanel';

const { themeSetMock, languageSetMock, getSettingMock, setSettingMock } = vi.hoisted(() => ({
  themeSetMock: vi.fn(),
  languageSetMock: vi.fn(),
  getSettingMock: vi.fn(),
  setSettingMock: vi.fn(),
}));

type DomSelectElement = globalThis.HTMLSelectElement;
type DomInputElement = globalThis.HTMLInputElement;
type DomButtonElement = globalThis.HTMLButtonElement;

vi.mock('@shared/services/LanguageService', () => {
  return {
    LanguageService: vi.fn().mockImplementation(() => ({
      getCurrentLanguage: vi.fn(() => 'ja'),
      setLanguage: languageSetMock,
      getString: vi.fn((key: string) => `xeg:${key}`),
    })),
    languageService: {
      getCurrentLanguage: vi.fn(() => 'ja'),
      setLanguage: languageSetMock,
      getString: vi.fn((key: string) => `xeg:${key}`),
    },
  };
});

vi.mock('@shared/services/ThemeService', () => {
  return {
    ThemeService: vi.fn().mockImplementation(() => ({
      getCurrentTheme: vi.fn(() => 'dark'),
      setTheme: themeSetMock,
    })),
  };
});

vi.mock('@shared/container/settings-access', () => {
  return {
    getSetting: getSettingMock,
    setSetting: setSettingMock,
  };
});

describe('FRAME-ALT-001 Stage B — Solid settings panel integration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    themeSetMock.mockClear();
    languageSetMock.mockClear();
    getSettingMock.mockReset().mockReturnValue(true);
    setSettingMock.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders persisted values, applies updates, and disposes cleanly', async () => {
    const onClose = vi.fn();
    const instance = renderSolidSettingsPanel({
      container,
      onClose,
    });

    await waitFor(() => {
      expect(container.querySelector('[data-xeg-solid-settings]')).not.toBeNull();
    });

    const root = container.querySelector('[data-xeg-solid-settings]') as HTMLElement;
    expect(root).not.toBeNull();

    const themeSelect = root.querySelector<DomSelectElement>('#xeg-solid-settings-theme');
    expect(themeSelect).not.toBeNull();
    expect(themeSelect?.value).toBe('dark');

    if (!themeSelect) {
      throw new Error('theme select not found');
    }

    themeSelect.value = 'light';
    themeSelect.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      expect(themeSetMock).toHaveBeenCalledWith('light');
    });

    const languageSelect = root.querySelector<DomSelectElement>('#xeg-solid-settings-language');
    expect(languageSelect?.value).toBe('ja');

    if (!languageSelect) {
      throw new Error('language select not found');
    }

    languageSelect.value = 'en';
    languageSelect.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      expect(languageSetMock).toHaveBeenCalledWith('en');
    });

    const toastToggle = root.querySelector<DomInputElement>('#xeg-solid-settings-progress-toast');
    expect(toastToggle?.checked).toBe(true);

    if (!toastToggle) {
      throw new Error('progress toast toggle not found');
    }

    toastToggle.checked = false;
    toastToggle.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      expect(setSettingMock).toHaveBeenCalledWith('download.showProgressToast', false);
    });

    const closeButton = root.querySelector<DomButtonElement>('[data-action="close-settings"]');
    expect(closeButton).not.toBeNull();
    closeButton?.click();
    expect(onClose).toHaveBeenCalledTimes(1);

    instance.dispose();

    await waitFor(() => {
      expect(container.querySelector('[data-xeg-solid-settings]')).toBeNull();
    });
  });
});
