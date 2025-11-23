import type { LanguageStrings } from "@shared/constants/i18n/language-types";

export const en: LanguageStrings = {
  toolbar: {
    previous: "Previous",
    next: "Next",
    download: "Download",
    downloadAll: "Download ZIP",
    settings: "Settings",
    close: "Close",
    tweetText: "Tweet text",
    tweetTextPanel: "Tweet text panel",
  },
  settings: {
    title: "Settings",
    theme: "Theme",
    language: "Language",
    themeAuto: "Auto",
    themeLight: "Light",
    themeDark: "Dark",
    languageAuto: "Auto / 자동 / 自動",
    languageKo: "한국어",
    languageEn: "English",
    languageJa: "日本語",
    close: "Close",
    gallery: {
      sectionTitle: "Gallery",
    },
  },
  messages: {
    errorBoundary: {
      title: "An error occurred",
      body: "An unexpected error occurred: {error}",
    },
    keyboardHelp: {
      title: "Keyboard shortcuts",
      navPrevious: "ArrowLeft: Previous media",
      navNext: "ArrowRight: Next media",
      close: "Escape: Close gallery",
      toggleHelp: "?: Show this help",
    },
    download: {
      single: {
        error: {
          title: "Download Failed",
          body: "Could not download the file: {error}",
        },
      },
      allFailed: {
        title: "Download Failed",
        body: "Failed to download all items.",
      },
      partial: {
        title: "Partial Failure",
        body: "Failed to download {count} items.",
      },
      retry: {
        action: "Retry",
        success: {
          title: "Retry Successful",
          body: "Successfully downloaded all previously failed items.",
        },
      },
      cancelled: {
        title: "Download Cancelled",
        body: "The requested download was cancelled.",
      },
    },
    gallery: {
      emptyTitle: "No media available",
      emptyDescription: "There are no images or videos to display.",
      failedToLoadImage: "Failed to load {type}",
    },
  },
};
