/**
 * @fileoverview 번역 레지스트리
 * @description 모든 언어의 번역 문자열을 중앙에서 관리
 */

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

/**
 * 지정된 언어의 번역 문자열을 반환
 */
export function getLanguageStrings(language: BaseLanguageCode): LanguageStrings {
  return TRANSLATION_REGISTRY[language];
}

/**
 * 지원하는 기본 언어 목록 반환 (읽기 전용)
 */
export function listBaseLanguages(): readonly BaseLanguageCode[] {
  return LANGUAGE_CODES;
}
