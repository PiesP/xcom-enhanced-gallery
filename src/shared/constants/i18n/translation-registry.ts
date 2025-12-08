import type { BaseLanguageCode, LanguageStrings } from './language-types';
import { en } from './languages/en';

/**
 * Default language bundle included in main bundle.
 * Other languages (ko, ja) are loaded on-demand via lazy loaders.
 */
export const TRANSLATION_REGISTRY: Partial<Record<BaseLanguageCode, LanguageStrings>> =
  Object.freeze({
    en,
  });

export const DEFAULT_LANGUAGE: BaseLanguageCode = 'en';

/**
 * Lazy loaders for non-default languages.
 * These are only loaded when the user selects the language.
 */
export const LAZY_LANGUAGE_LOADERS: Record<
  Exclude<BaseLanguageCode, 'en'>,
  () => Promise<LanguageStrings>
> = {
  ko: async () => {
    const { ko } = await import('./languages/ko');
    return ko;
  },
  ja: async () => {
    const { ja } = await import('./languages/ja');
    return ja;
  },
};

/**
 * Get language strings synchronously (only works for bundled languages).
 * For lazy-loaded languages, use TranslationCatalog.ensureLanguage().
 */
export function getLanguageStrings(language: BaseLanguageCode): LanguageStrings {
  const strings = TRANSLATION_REGISTRY[language];
  if (strings) {
    return strings;
  }
  // Fallback to default language if requested language not loaded
  return TRANSLATION_REGISTRY[DEFAULT_LANGUAGE]!;
}
