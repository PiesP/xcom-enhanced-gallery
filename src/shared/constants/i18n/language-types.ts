/**
 * Supported language codes for the application
 * These must match the available language files in the languages directory
 */
export const LANGUAGE_CODES = ['en', 'ko', 'ja'] as const;

/**
 * Base language code type derived from LANGUAGE_CODES
 */
export type BaseLanguageCode = (typeof LANGUAGE_CODES)[number];

/**
 * Supported language options including auto-detection
 */
export type SupportedLanguage = 'auto' | BaseLanguageCode;

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
  };
  /** Message strings */
  readonly msg: {
    /** Error messages */
    readonly err: {
      /** Error title */
      readonly t: string;
      /** Error body */
      readonly b: string;
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
    };
  };
}

/**
 * Type guard to check if a value is a valid base language code
 * @param value - Value to check
 * @returns True if value is a valid BaseLanguageCode
 */
export function isBaseLanguageCode(value: string | null | undefined): value is BaseLanguageCode {
  return value === 'en' || value === 'ko' || value === 'ja';
}
