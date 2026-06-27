// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { LanguageStrings } from '@shared/constants/i18n/language-types';

/**
 * English language strings for the application
 */
export const en: LanguageStrings = {
  tb: {
    prev: 'Previous',
    next: 'Next',
    dl: 'Download',
    dlAllCt: 'Download all {count} files as ZIP',
    setOpen: 'Open Settings',
    cls: 'Close',
    twTxt: 'View tweet',
    twPanel: 'Tweet text panel',
    twUrl: 'View original tweet',
    fitOri: 'Original',
    fitW: 'Fit Width',
    fitH: 'Fit Height',
    fitC: 'Fit Window',
    galleryToolbar: 'Gallery Toolbar',
    progress: 'Progress',
    settingsPanel: 'Settings Panel',
  },
  st: {
    th: 'Theme',
    lang: 'Language',
    thAuto: 'Auto',
    thLt: 'Light',
    thDk: 'Dark',
    langAuto: 'Auto / 자동 / 自動 / Auto / تلقائي',
    langKo: 'Korean',
    langEn: 'English',
    langJa: 'Japanese',
    langZhCn: 'Simplified Chinese',
    langEs: 'Spanish',
    langAr: 'Arabic',
  },
  msg: {
    err: {
      t: 'An error occurred',
      b: 'An unexpected error occurred: {error}',
    },
    kb: {
      t: 'Keyboard shortcuts',
      prev: 'ArrowLeft: Previous media',
      next: 'ArrowRight: Next media',
      cls: 'Escape: Close gallery',
      toggle: '?: Show this help',
    },
    dl: {
      one: {
        err: {
          t: 'Download Failed',
          b: 'Could not download the file: {error}',
        },
      },
      allFail: {
        t: 'Download Failed',
        b: 'Failed to download all items.',
      },
      part: {
        t: 'Partial Failure',
        b: 'Failed to download {count} items.',
      },
      noMedia: 'No media item selected. Please re-open the gallery and try again.',
      zipFail: 'Failed to save ZIP file',
    },
    gal: {
      emptyT: 'No media available',
      emptyD: 'There are no images or videos to display.',
      itemLbl: 'Media {index}: {filename}',
      loadFail: 'Failed to load {type}',
      imageGallery: 'Image gallery',
    },
  },
};
