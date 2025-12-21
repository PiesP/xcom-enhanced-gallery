import type { LanguageStrings } from '@shared/constants/i18n/language-types';

export const en: LanguageStrings = {
  tb: {
    prev: 'Previous',
    next: 'Next',
    dl: 'Download',
    dlAll: 'Download ZIP',
    dlAllCt: 'Download all {count} files as ZIP',
    set: 'Settings',
    setOpen: 'Open Settings',
    cls: 'Close',
    twTxt: 'Tweet text',
    twPanel: 'Tweet text panel',
    fitOri: 'Original',
    fitW: 'Fit Width',
    fitH: 'Fit Height',
    fitC: 'Fit Window',
  },
  st: {
    ttl: 'Settings',
    th: 'Theme',
    lang: 'Language',
    thAuto: 'Auto',
    thLt: 'Light',
    thDk: 'Dark',
    langAuto: 'Auto / 자동 / 自動',
    langKo: '한국어',
    langEn: 'English',
    langJa: '日本語',
    cls: 'Close',
    gal: {
      sec: 'Gallery',
    },
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
      retry: {
        act: 'Retry',
        ok: {
          t: 'Retry Successful',
          b: 'Successfully downloaded all previously failed items.',
        },
      },
      cancel: {
        t: 'Download Cancelled',
        b: 'The requested download was cancelled.',
      },
    },
    gal: {
      emptyT: 'No media available',
      emptyD: 'There are no images or videos to display.',
      itemLbl: 'Media {index}: {filename}',
      loadFail: 'Failed to load {type}',
    },
  },
};
