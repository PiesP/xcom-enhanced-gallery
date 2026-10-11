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
    dlAllCt: 'Download {count} shown files as ZIP',
    setOpen: 'Open Settings',
    cls: 'Close',
    twTxt: 'View tweet',
    twPanel: 'Tweet text panel',
    twUrl: 'View original tweet',
    fitOri: 'Original',
    fitW: 'Fit Width',
    fitH: 'Fit Height',
    fitC: 'Fit Window',
    currentFit: 'Fit: {mode}',
    mediaPosition: 'Media {index} of {total}',
    noMedia: 'No media',
    galleryToolbar: 'Gallery Toolbar',
    navigationGroup: 'Navigation and position',
    fitGroup: 'View fit',
    downloadGroup: 'Downloads',
    auxGroup: 'More actions',
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
      loadMedia: {
        title: 'Failed to load media',
        body: 'Could not find images or videos.',
        unsupported:
          'This video only provides HLS streaming. Gallery playback and download require a verified MP4 source.',
        noMedia: 'No media was returned for this post.',
        denied: 'The media service denied this request. Try again later.',
        unreadable: 'The media response could not be read. Try again later.',
        rateLimited: 'The media service is rate limiting requests. Try again later.',
        deferred: 'The media service asked us to wait. Try again later.',
        providerError: 'The media service could not provide this post. Try again later.',
        transport: 'Could not reach the media service. Try again later.',
        ownerUnconfirmed: 'Could not confirm which post owns the selected media.',
        mismatch: 'The returned media did not match the selected item.',
        cancelled: 'Media loading was cancelled.',
      },
      generic: 'Error occurred',
      loadGallery: 'Failed to load gallery',
      settingsUnavailable: {
        title: 'Settings unavailable',
        body: 'Defaults will be used until settings load.',
      },
      retry: 'Retry',
      noMoreRetries: 'No more retries',
      reset: 'Reset',
    },
    kb: {
      t: 'Keyboard shortcuts',
      prev: 'ArrowLeft: Previous media',
      next: 'ArrowRight: Next media',
      cls: 'Escape: Close gallery',
      toggle: '?: Show this help',
    },
    dl: {
      status: {
        working: 'Preparing download…',
        handedOff: 'Handed off to browser',
        error: 'Download failed',
      },
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
        resourceLimit:
          'The ZIP includes {count} files; {failed} files were left out. The download memory limit was reached. Wait for active downloads to finish. If none are active and the limit remains, reload this page. Then retry with fewer files.',
      },
      noMedia: 'No media item selected. Please re-open the gallery and try again.',
      zipFail: 'Failed to save ZIP file',
      sourceUnavailable:
        'The original image source could not be verified. This item was not saved. Reopen the post and try again.',
      resourceLimit:
        'The download memory limit was reached. Wait for active downloads to finish. If none are active and the limit remains, reload this page. Then retry with fewer files.',
    },
    gal: {
      video: {
        playbackFallback:
          'Playback uses another rendition; downloads keep the best available source.',
      },
      observedQuality: {
        title: 'Recovered source quality',
        body: 'Source quality could not be verified for some items. Images without a verified original cannot be saved; recovered videos use the observed source.',
      },
      partialRecovery: {
        title: 'Visible media only',
        body: 'Recovered media from this tile only. Bulk download includes only the items shown.',
      },
      emptyT: 'No media available',
      emptyD: 'There are no images or videos to display.',
      itemLbl: 'Media {index}: {filename}',
      loadFail: 'Failed to load {type}',
      imageGallery: 'Image gallery',
      loading: 'Loading',
      videoCount: 'Video {index} of {total}',
      imageCount: 'Image {index} of {total}: {alt}',
      hashtagLabel: 'Hashtag {value}',
    },
  },
};
