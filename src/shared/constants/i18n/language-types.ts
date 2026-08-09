// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { Locale, SettingLocale } from '@piesp/browser-core/locale';
import { LOCALE_CODES } from '@piesp/browser-core/locale';

/**
 * Supported language codes for the application
 * These must match the available language files in the languages directory
 */
export const LANGUAGE_CODES = LOCALE_CODES;

/**
 * Base language code type derived from LANGUAGE_CODES
 */
export type BaseLanguageCode = Locale;

/**
 * Supported language options including auto-detection
 */
export type SupportedLanguage = SettingLocale;

const NORMALIZED_LANGUAGE_CODES: ReadonlySet<string> = new Set(
  LANGUAGE_CODES.map((code) => code.toLowerCase())
);

/**
 * Translation schema contract shared across all languages
 * All language files must implement this exact structure
 */
export interface LanguageStrings {
  /** Toolbar strings */
  readonly tb: {
    /** Previous button */
    readonly prev: string;
    /** Next button */
    readonly next: string;
    /** Download button */
    readonly dl: string;
    /** Download all count message */
    readonly dlAllCt: string;
    /** Settings open button */
    readonly setOpen: string;
    /** Close button */
    readonly cls: string;
    /** Tweet text label */
    readonly twTxt: string;
    /** Tweet panel label */
    readonly twPanel: string;
    /** Tweet URL label */
    readonly twUrl: string;
    /** Fit original label */
    readonly fitOri: string;
    /** Fit width label */
    readonly fitW: string;
    /** Fit height label */
    readonly fitH: string;
    /** Fit container label */
    readonly fitC: string;
    /** Gallery toolbar label */
    readonly galleryToolbar: string;
    /** Progress bar label */
    readonly progress: string;
    /** Settings panel label */
    readonly settingsPanel: string;
  };
  /** Settings strings */
  readonly st: {
    /** Theme label */
    readonly th: string;
    /** Language label */
    readonly lang: string;
    /** Theme auto option */
    readonly thAuto: string;
    /** Theme light option */
    readonly thLt: string;
    /** Theme dark option */
    readonly thDk: string;
    /** Language auto option */
    readonly langAuto: string;
    /** Korean language option */
    readonly langKo: string;
    /** English language option */
    readonly langEn: string;
    /** Japanese language option */
    readonly langJa: string;
    /** Simplified Chinese language option */
    readonly langZhCn: string;
    /** Spanish language option */
    readonly langEs: string;
    /** Arabic language option */
    readonly langAr: string;
  };
  /** Message strings */
  readonly msg: {
    /** Error messages */
    readonly err: {
      /** Error title */
      readonly t: string;
      /** Error body */
      readonly b: string;
      /** Load media error title */
      readonly loadMedia: {
        /** Load media error title */
        readonly title: string;
        /** Load media error body */
        readonly body: string;
      };
      /** Generic error title */
      readonly generic: string;
      /** Load gallery error title */
      readonly loadGallery: string;
      /** Settings unavailable error */
      readonly settingsUnavailable: {
        /** Settings unavailable title */
        readonly title: string;
        /** Settings unavailable body */
        readonly body: string;
      };
      /** Retry button label */
      readonly retry: string;
      /** No more retries button label */
      readonly noMoreRetries: string;
      /** Reset button label */
      readonly reset: string;
    };
    /** Keyboard shortcut messages */
    readonly kb: {
      /** Keyboard shortcuts title */
      readonly t: string;
      /** Previous shortcut */
      readonly prev: string;
      /** Next shortcut */
      readonly next: string;
      /** Close shortcut */
      readonly cls: string;
      /** Toggle help shortcut */
      readonly toggle: string;
    };
    /** Download messages */
    readonly dl: {
      /** Single file download messages */
      readonly one: {
        /** Single download error */
        readonly err: {
          /** Error title */
          readonly t: string;
          /** Error body */
          readonly b: string;
        };
      };
      /** All files failed messages */
      readonly allFail: {
        /** All fail title */
        readonly t: string;
        /** All fail body */
        readonly b: string;
      };
      /** Partial failure messages */
      readonly part: {
        /** Partial fail title */
        readonly t: string;
        /** Partial fail body */
        readonly b: string;
      };
      /** No media item selected message */
      readonly noMedia: string;
      /** ZIP save failure fallback */
      readonly zipFail: string;
      /** Bulk ZIP memory-limit guidance */
      readonly zipTooLarge: string;
    };
    /** Gallery messages */
    readonly gal: {
      /** Empty gallery title */
      readonly emptyT: string;
      /** Empty gallery description */
      readonly emptyD: string;
      /** Item label */
      readonly itemLbl: string;
      /** Load failure message */
      readonly loadFail: string;
      /** Image gallery label */
      readonly imageGallery: string;
      /** Loading indicator label */
      readonly loading: string;
      /** Video count label */
      readonly videoCount: string;
      /** Image count label */
      readonly imageCount: string;
      /** Hashtag label */
      readonly hashtagLabel: string;
    };
  };
}

/**
 * Type guard to check if a value is a valid base language code.
 * Normalizes case before comparison so BCP 47 variants (e.g., `zh-CN`) are accepted.
 * @param value - Value to check
 * @returns True if value is a valid BaseLanguageCode
 */
export function isBaseLanguageCode(value: string | null | undefined): value is BaseLanguageCode {
  return value ? NORMALIZED_LANGUAGE_CODES.has(value.toLowerCase()) : false;
}
