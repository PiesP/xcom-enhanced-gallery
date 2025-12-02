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
    translate: (key: string) => {
      const map: Record<string, string> = {
        'toolbar.previous': 'Previous',
        'toolbar.next': 'Next',
        'toolbar.download': 'Download',
        'toolbar.downloadAll': 'Download All',
      };
      return map[key] || key;
    },
    getCurrentLanguage: () => 'en',
    setLanguage: () => {},
    onLanguageChange: () => () => {},
  }),
  tryGetSettingsManager: () => null,
}));

vi.mock('@shared/services/language-service', () => ({
  languageService: {
    translate: (key: string) => {
      const map: Record<string, string> = {
        'toolbar.previous': 'Previous',
        'toolbar.next': 'Next',
        'toolbar.download': 'Download',
        'toolbar.downloadAll': 'Download All',
      };
      return map[key] || key;
    },
    getCurrentLanguage: () => 'en',
    setLanguage: () => {},
    onLanguageChange: () => () => {},
  },
}));

vi.mock('@shared/services/theme-service', () => ({
  themeService: {
    getCurrentTheme: () => 'auto',
    setTheme: () => {},
    onThemeChange: () => () => {},
    isInitialized: () => true,
    initialize: async () => {},
    destroy: () => {},
    getEffectiveTheme: () => 'light',
    isDarkMode: () => false,
    bindSettingsService: () => {},
  },
}));

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

describe('Toolbar download state behavior', () => {
  it('disables only download buttons when isDownloading is true and disabled is false', async () => {
    const handlePrevious = vi.fn();
    const handleNext = vi.fn();
    const handleDownloadCurrent = vi.fn();
    const handleDownloadAll = vi.fn();

    const { getByRole } = render(() =>
      Toolbar(
        createToolbarProps({
          onPrevious: handlePrevious,
          onNext: handleNext,
          onDownloadCurrent: handleDownloadCurrent,
          onDownloadAll: handleDownloadAll,
          isDownloading: () => true,
          disabled: () => false,
          currentIndex: () => 1,
          totalCount: () => 3,
        }),
      ),
    );

    // Navigation should be enabled
    const prevButton = getByRole('button', {
      name: 'Previous Media',
    }) as HTMLButtonElement;
    const nextButton = getByRole('button', {
      name: 'Next Media',
    }) as HTMLButtonElement;

    expect(prevButton.disabled).toBe(false);
    expect(nextButton.disabled).toBe(false);

    await fireEvent.click(prevButton);
    expect(handlePrevious).toHaveBeenCalled();

    // Download buttons should be disabled
    const downloadButton = getByRole('button', {
      name: 'Download Current File',
    }) as HTMLButtonElement;
    const downloadAllButton = getByRole('button', {
      name: 'Download all 3 files as ZIP',
    }) as HTMLButtonElement;

    expect(downloadButton.disabled).toBe(true);
    expect(downloadAllButton.disabled).toBe(true);

    await fireEvent.click(downloadButton);
    expect(handleDownloadCurrent).not.toHaveBeenCalled();
  });

  it('disables everything when disabled prop is true', async () => {
    const handlePrevious = vi.fn();

    const { getByRole } = render(() =>
      Toolbar(
        createToolbarProps({
          onPrevious: handlePrevious,
          disabled: () => true,
          currentIndex: () => 1,
          totalCount: () => 3,
        }),
      ),
    );

    const prevButton = getByRole('button', {
      name: 'Previous Media',
    }) as HTMLButtonElement;
    expect(prevButton.disabled).toBe(true);

    await fireEvent.click(prevButton);
    expect(handlePrevious).not.toHaveBeenCalled();
  });
});
