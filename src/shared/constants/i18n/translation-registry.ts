import type { BaseLanguageCode, LanguageStrings } from './language-types';
import { en } from './languages/en';
import { ja } from './languages/ja';
import { ko } from './languages/ko';

export const TRANSLATION_REGISTRY: Partial<Record<BaseLanguageCode, LanguageStrings>> = {
  en,
  ko,
  ja,
} as const;

export const DEFAULT_LANGUAGE: BaseLanguageCode = 'en';
