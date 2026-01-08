export const LANGUAGE_CODES = ['en', 'ko', 'ja'] as const;

export type BaseLanguageCode = (typeof LANGUAGE_CODES)[number];

export type SupportedLanguage = 'auto' | BaseLanguageCode;

export interface LanguageStrings {
  readonly tb: {
    readonly prev: string;
    readonly next: string;
    readonly dl: string;
    readonly dlAllCt: string;
    readonly setOpen: string;
    readonly cls: string;
    readonly twTxt: string;
    readonly twPanel: string;
    readonly twUrl: string;
    readonly fitOri: string;
    readonly fitW: string;
    readonly fitH: string;
    readonly fitC: string;
  };
  readonly st: {
    readonly th: string;
    readonly lang: string;
    readonly thAuto: string;
    readonly thLt: string;
    readonly thDk: string;
    readonly langAuto: string;
    readonly langKo: string;
    readonly langEn: string;
    readonly langJa: string;
  };
  readonly msg: {
    readonly err: {
      readonly t: string;
      readonly b: string;
    };
    readonly kb: {
      readonly t: string;
      readonly prev: string;
      readonly next: string;
      readonly cls: string;
      readonly toggle: string;
    };
    readonly dl: {
      readonly one: {
        readonly err: {
          readonly t: string;
          readonly b: string;
        };
      };
      readonly allFail: {
        readonly t: string;
        readonly b: string;
      };
      readonly part: {
        readonly t: string;
        readonly b: string;
      };
    };
    readonly gal: {
      readonly emptyT: string;
      readonly emptyD: string;
      readonly itemLbl: string;
      readonly loadFail: string;
    };
  };
}

export function isBaseLanguageCode(value: string | null | undefined): value is BaseLanguageCode {
  return value === 'en' || value === 'ko' || value === 'ja';
}
