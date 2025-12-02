import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { fireEvent, render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@shared/components/ui/Settings/SettingsControlsLazy', () => ({
  SettingsControlsLazy: () => null,
}));

vi.mock('@shared/container/service-accessors', () => ({
  getThemeService: () => ({
    getCurrentTheme: () => 'auto',
    setTheme: () => {},
    onThemeChange: () => () => {},
    isInitialized: () => true,
    initialize: async () => {},
    destroy: () => {},
    getEffectiveTheme: () => 'light',
    isDarkMode: () => false,
    bindSettingsService: () => {},
  }),
  getLanguageService: () => ({
    translate: () => 'Tweet text',
    getCurrentLanguage: () => 'en',
    setLanguage: () => {},
    onLanguageChange: () => () => {},
  }),
  tryGetSettingsManager: () => null,
}));

vi.mock('@shared/services/language-service', () => {
  const listeners = new Set<(language: string) => void>();

  return {
    languageService: {
      translate: () => 'Tweet text',
      getCurrentLanguage: () => 'en',
      setLanguage: () => {},
      onLanguageChange: (listener: (language: string) => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    },
  };
});

vi.mock('@shared/services/theme-service', () => {
  const listeners = new Set<(theme: string, setting: string) => void>();

  const themeService = {
    getCurrentTheme: () => 'auto',
    setTheme: (setting: string) => {
      const theme = setting === 'dark' ? 'dark' : 'light';
      listeners.forEach(listener => listener(theme, setting));
    },
    onThemeChange: (listener: (theme: string, setting: string) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    isInitialized: () => true,
    initialize: async () => {},
    destroy: () => {},
    getEffectiveTheme: () => 'light',
    isDarkMode: () => false,
    bindSettingsService: () => {},
  };

  return { themeService };
});

const noop = () => {};

const createToolbarProps = (overrides: Partial<Parameters<typeof Toolbar>[0]> = {}) => ({
  currentIndex: () => 0,
  totalCount: () => 3,
  onPrevious: noop,
  onNext: noop,
  onDownloadCurrent: noop,
  onDownloadAll: noop,
  onClose: noop,
  onFitOriginal: noop,
  onFitWidth: noop,
  onFitHeight: noop,
  onFitContainer: noop,
  ...overrides,
});

describe('Toolbar navigation wrap-around', () => {
  it('keeps the previous button enabled at the first index when multiple items exist', async () => {
    const handlePrevious = vi.fn();
    const { getByRole } = render(() =>
      Toolbar(
        createToolbarProps({
          onPrevious: handlePrevious,
          currentIndex: () => 0,
          totalCount: () => 5,
        }),
      ),
    );

    const previousButton = getByRole('button', {
      name: 'Previous Media',
    }) as HTMLButtonElement;
    expect(previousButton.disabled).toBe(false);

    await fireEvent.click(previousButton);
    expect(handlePrevious).toHaveBeenCalledTimes(1);
  });

  it('keeps the next button enabled at the last index when multiple items exist', async () => {
    const handleNext = vi.fn();
    const totalCount = 4;
    const { getByRole } = render(() =>
      Toolbar(
        createToolbarProps({
          onNext: handleNext,
          currentIndex: () => totalCount - 1,
          totalCount: () => totalCount,
        }),
      ),
    );

    const nextButton = getByRole('button', {
      name: 'Next Media',
    }) as HTMLButtonElement;
    expect(nextButton.disabled).toBe(false);

    await fireEvent.click(nextButton);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });
});
