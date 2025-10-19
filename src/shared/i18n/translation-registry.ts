import { LANGUAGE_CODES, type BaseLanguageCode, type LanguageStrings } from './language-types';
import { en } from './languages/en';
import { ko } from './languages/ko';
import { ja } from './languages/ja';

const REGISTRY: Record<BaseLanguageCode, LanguageStrings> = Object.freeze({
  en,
  ko,
  ja,
});

export const TRANSLATION_REGISTRY = REGISTRY;
export const DEFAULT_LANGUAGE: BaseLanguageCode = 'en';

export function getLanguageStrings(language: BaseLanguageCode): LanguageStrings {
  return TRANSLATION_REGISTRY[language];
}

export function listBaseLanguages(): readonly BaseLanguageCode[] {
  return LANGUAGE_CODES;
}
