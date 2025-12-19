import type { LanguageStrings } from '@shared/constants/i18n/language-types';

export const en: LanguageStrings = {
  toolbar: {
    previous: 'Previous',
    previousWithShortcut: 'Previous (Left Arrow)',
    next: 'Next',
    nextWithShortcut: 'Next (Right Arrow)',
    download: 'Download',
    downloadCurrentWithShortcut: 'Download Current File',
    downloadAll: 'Download ZIP',
    downloadAllWithCount: 'Download all {count} files as ZIP',
    settings: 'Settings',
    openSettings: 'Open Settings',
    close: 'Close',
    closeWithShortcut: 'Close (Esc)',
    tweetText: 'Tweet text',
    tweetTextPanel: 'Tweet text panel',
    fitOriginal: 'Original',
    fitOriginalTitle: 'Original Size (1:1)',
    fitWidth: 'Fit Width',
    fitWidthTitle: 'Fit to Width',
    fitHeight: 'Fit Height',
    fitHeightTitle: 'Fit to Height',
    fitContainer: 'Fit Window',
    fitContainerTitle: 'Fit to Window',
  },
  settings: {
    title: 'Settings',
    theme: 'Theme',
    language: 'Language',
    themeAuto: 'Auto',
    themeLight: 'Light',
    themeDark: 'Dark',
    languageAuto: 'Auto / 자동 / 自動',
    languageKo: '한국어',
    languageEn: 'English',
    languageJa: '日本語',
    close: 'Close',
    gallery: {
      sectionTitle: 'Gallery',
    },
  },
  messages: {
    errorBoundary: {
      title: 'An error occurred',
      body: 'An unexpected error occurred: {error}',
    },
    keyboardHelp: {
      title: 'Keyboard shortcuts',
      navPrevious: 'ArrowLeft: Previous media',
      navNext: 'ArrowRight: Next media',
      close: 'Escape: Close gallery',
      toggleHelp: '?: Show this help',
    },
    download: {
      single: {
        error: {
          title: 'Download Failed',
          body: 'Could not download the file: {error}',
        },
      },
      allFailed: {
        title: 'Download Failed',
        body: 'Failed to download all items.',
      },
      partial: {
        title: 'Partial Failure',
        body: 'Failed to download {count} items.',
      },
      retry: {
        action: 'Retry',
        success: {
          title: 'Retry Successful',
          body: 'Successfully downloaded all previously failed items.',
        },
      },
      cancelled: {
        title: 'Download Cancelled',
        body: 'The requested download was cancelled.',
      },
    },
    gallery: {
      emptyTitle: 'No media available',
      emptyDescription: 'There are no images or videos to display.',
      mediaItemLabel: 'Media {index}: {filename}',
      failedToLoadImage: 'Failed to load {type}',
    },
  },
};
