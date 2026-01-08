import type { BaseLanguageCode, LanguageStrings } from './i18n.types';
import { en } from './languages/en';
import { ja } from './languages/ja';
import { ko } from './languages/ko';

export const TRANSLATION_REGISTRY: Partial<Record<BaseLanguageCode, LanguageStrings>> = {
  en,
  ko,
  ja,
} as const;

export const DEFAULT_LANGUAGE: BaseLanguageCode = 'en';

export function getLanguageStrings(language: BaseLanguageCode): LanguageStrings {
  const strings = TRANSLATION_REGISTRY[language];
  if (strings) {
    return strings;
  }

  const defaultStrings = TRANSLATION_REGISTRY[DEFAULT_LANGUAGE];

  if (!defaultStrings) {
    throw new Error(
      `Fatal: Default language '${DEFAULT_LANGUAGE}' not found in TRANSLATION_REGISTRY.`
    );
  }

  return defaultStrings;
}
