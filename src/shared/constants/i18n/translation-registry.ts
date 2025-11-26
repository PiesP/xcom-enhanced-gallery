import type { BaseLanguageCode, LanguageStrings } from './language-types';
import { en } from './languages/en';
import { ja } from './languages/ja';
import { ko } from './languages/ko';

export const TRANSLATION_REGISTRY: Record<BaseLanguageCode, LanguageStrings> = Object.freeze({
  en,
  ko,
  ja,
});

export const DEFAULT_LANGUAGE: BaseLanguageCode = 'en';

export function getLanguageStrings(language: BaseLanguageCode): LanguageStrings {
  return TRANSLATION_REGISTRY[language];
}
