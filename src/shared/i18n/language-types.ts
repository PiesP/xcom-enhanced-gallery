/*
 * 언어 코드와 문자열 스키마 정의
 */
export const LANGUAGE_CODES = ['en', 'ko', 'ja'] as const;
export type BaseLanguageCode = (typeof LANGUAGE_CODES)[number];
export type SupportedLanguage = 'auto' | BaseLanguageCode;

export interface LanguageStrings {
  readonly toolbar: {
    readonly previous: string;
    readonly next: string;
    readonly download: string;
    readonly downloadAll: string;
    readonly settings: string;
    readonly close: string;
  };
  readonly settings: {
    readonly title: string;
    readonly theme: string;
    readonly language: string;
    readonly themeAuto: string;
    readonly themeLight: string;
    readonly themeDark: string;
    readonly languageAuto: string;
    readonly languageKo: string;
    readonly languageEn: string;
    readonly languageJa: string;
    readonly close: string;
    readonly gallery: {
      readonly sectionTitle: string;
    };
  };
  readonly messages: {
    readonly errorBoundary: {
      readonly title: string;
      readonly body: string;
    };
    readonly keyboardHelp: {
      readonly title: string;
      readonly navPrevious: string;
      readonly navNext: string;
      readonly close: string;
      readonly toggleHelp: string;
    };
    readonly download: {
      readonly single: {
        readonly error: {
          readonly title: string;
          readonly body: string;
        };
      };
      readonly allFailed: {
        readonly title: string;
        readonly body: string;
      };
      readonly partial: {
        readonly title: string;
        readonly body: string;
      };
      readonly retry: {
        readonly action: string;
        readonly success: {
          readonly title: string;
          readonly body: string;
        };
      };
      readonly cancelled: {
        readonly title: string;
        readonly body: string;
      };
    };
    readonly gallery: {
      readonly emptyTitle: string;
      readonly emptyDescription: string;
      readonly failedToLoadImage: string;
    };
  };
}

const LOOKUP = new Set<string>(LANGUAGE_CODES);

export function isBaseLanguageCode(value: string | null | undefined): value is BaseLanguageCode {
  return value != null && LOOKUP.has(value);
}
