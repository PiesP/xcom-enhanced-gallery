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
    helpOpen: 'Keyboard help',
    helpPanel: 'Keyboard help panel',
    helpClose: 'Close help',
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
    videoClickMode: 'Video clicks',
    videoClickNative: 'Keep video clicks in X',
    videoClickSurfaces: 'Open gallery from the video area',
    videoClickUnmarked: 'Also open from supported play buttons',
    videoClickHelp:
      'Choose where eligible video clicks go. The gallery starts a separate paused player at the beginning with its saved audio settings; closing it does not automatically resume X. Ordinary player controls stay in X.',
    videoClickSaveError:
      'Could not save Video clicks. The current setting is still active. Try again.',
    unsavedSettings: 'Settings are active for this session but were not saved.',
    unsavedSession: 'Active in this session · not saved',
    retrySettingsSave: 'Retry saving',
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
        resourceLimit: 'This post exceeds the metadata size limit. Open it on X to view its media.',
        rateLimited: 'The media service is rate limiting requests. Try again later.',
        deferred: 'The media service asked us to wait. Try again later.',
        providerError: 'The media service could not provide this post. Try again later.',
        transport: 'Could not reach the media service. Try again later.',
        ownerUnconfirmed: 'Could not confirm which post owns the selected media.',
        mismatch: 'The returned media did not match the selected item.',
        cancelled: 'Media loading was cancelled.',
        nativeVideoRecovery:
          'Use the video’s play/pause controls on X, or press Alt+Shift+V to keep video clicks in X.',
        nativeVideoControls: 'Use the video’s play/pause controls on X to continue watching.',
        nativeVideoEnabled:
          'Video clicks now stay in X. Change Video clicks in gallery settings to use the gallery again.',
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
      prev: 'Left: previous displayed item',
      next: 'Right: next displayed item',
      cls: 'Escape: close the gallery; with focus in the toolbar, close open Settings or Keyboard help first',
      toggle: '?: open this help',
      firstLast: 'Home / End: first / last item',
      five: 'PageUp / PageDown: five items backward / forward',
      vertical: 'Up / Down: change image item; adjust volume for the displayed gallery video',
      playback: 'Space: play or pause the gallery video; M: mute or unmute',
      focus: 'Tab / Shift+Tab: move through controls',
      context: 'Focused buttons keep Space / Enter; forms and panels keep their own keys.',
      recovery: 'Alt+Shift+V is available only after an eligible failed video click.',
    },
    dl: {
      filenameNotice: {
        label: 'Saved filename',
        mismatch: 'The saved name differs from the requested name.',
        dismiss: 'Dismiss filename notice',
      },
      bulkOutcome: {
        cancelRecoveryAndDismiss: 'Cancel missing-item recovery and dismiss ZIP result',
        details: 'ZIP result details',
        titleHandedOff: 'ZIP handed off to browser',
        titleFailed: 'No ZIP handed off',
        previous: 'Previous ZIP result',
        scope: 'Scope: {total} media items shown in this gallery.',
        scopeSupplementary: 'Scope: {total} previously missing items from this gallery.',
        counts: 'ZIP includes {included}; left out {omitted}.',
        browserHandoff:
          'The browser accepted the ZIP request. Completion on disk is not confirmed.',
        noZip: 'No ZIP was handed off to the browser.',
        resourceLimit:
          'Download memory limit reached. Wait for active downloads; reload the page if the limit remains.',
        sourceUnavailable:
          'An original image source could not be verified. Reopen the original post to try that item.',
        sourceFetchFailed:
          'A media source request failed (HTTP {statuses}). Reopen the original post and retry the omitted items.',
        zipSaveFailed: 'The ZIP was prepared, but the browser did not accept the save request.',
        other: 'Some items could not be included. Reopen the gallery to try again.',
        nextAction:
          'Download all starts a new ZIP for every shown item, including items already handed off. Reopen the post and try fewer items if needed.',
        nextActionSupplementary:
          'This ZIP only contains recovered missing items. Keep the earlier ZIP for the other items.',
        recoverMissing: 'Download {count} missing items as a separate ZIP',
        dismiss: 'Dismiss ZIP result',
      },
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
      sourceDetails: {
        title: 'Media and save details',
        shown: '{count} collected items · the post may contain more',
        knownSubset: '{count} supported items · some observed media cannot be saved',
        cdnOriginal: 'Save source: verified original image from X’s CDN.',
        bestMp4: 'Save source: best available MP4 from X.',
        observed: 'Video save quality is unverified',
        observedDetail:
          'Saving uses the observed video source. Playback may use a different rendition.',
        unavailable: 'Original image unavailable for saving',
        unavailableDetail:
          'A verified original image was not found. This item cannot be saved; no lower-quality replacement is used.',
        pending: 'Original image will be checked when saving',
        pendingDetail:
          'This image has not been checked yet. Saving it or the ZIP will check the original source first.',
      },
      entryFailureNext: 'Use the post on X to view this media.',
      downloadFailureNext:
        'Check your browser’s downloads for the save status, or return to the post on X.',
      dismissFailure: 'Dismiss error',
      mediaType: { image: 'Image', video: 'Video' },
      video: {
        playbackFallback:
          'Playback uses another rendition; downloads keep the best available source.',
      },
      observedQuality: {
        title: 'Recovered source quality',
        body: 'Source quality could not be verified for some items. Images need a verified original before saving; recovered videos use the observed source.',
      },
      partialRecovery: {
        title: 'Visible media only',
        body: 'Only currently available media was collected. The post may contain more; bulk download includes only collected items.',
      },
      knownSubset: {
        title: 'Some media cannot be saved',
        body: 'The source included unsupported media. The gallery and ZIP contain only the supported items collected.',
      },
      emptyT: 'No media available',
      emptyD: 'There are no images or videos to display.',
      itemLbl: 'Media {index}: {filename}',
      loadFail: 'Failed to load {type}',
      imageGallery: 'Image gallery',
      loading: 'Loading',
      opening: 'Opening gallery…',
      retryLoading: 'Retry loading',
      retryExhausted: 'Still unavailable. Reopen the gallery or try the original post.',
      openOriginalPost: 'Open original post',
      videoCount: 'Video {index} of {total}',
      imageCount: 'Image {index} of {total}: {alt}',
      hashtagLabel: 'Hashtag {value}',
    },
  },
};
