export const LANGUAGE_CODES = ['en', 'ko', 'ja'] as const;
export type BaseLanguageCode = (typeof LANGUAGE_CODES)[number];
export type SupportedLanguage = 'auto' | BaseLanguageCode;
/**
 * Translation schema contract shared across all languages.
 */
export interface LanguageStrings {
  readonly toolbar: {
    readonly previous: string;
    readonly next: string;
    readonly download: string;
    readonly downloadAll: string;
    readonly settings: string;
    readonly close: string;
    readonly tweetText: string;
    readonly tweetTextPanel: string;
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
      readonly mediaItemLabel: string;
      readonly failedToLoadImage: string;
    };
  };
}

const LANGUAGE_CODE_LOOKUP = new Set<string>(LANGUAGE_CODES);

/**
 * Returns whether the provided value matches a supported language code.
 */
export function isBaseLanguageCode(value: string | null | undefined): value is BaseLanguageCode {
  return value != null && LANGUAGE_CODE_LOOKUP.has(value);
}
