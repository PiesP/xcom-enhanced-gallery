/**
 * @fileoverview 번역 레지스트리
 * @description Phase 225: i18n 데이터 저장소 및 접근 API
 * @version 2.0.0
 *
 * 주요 기능:
 * - 모든 언어의 번역 문자열 중앙 관리
 * - 언어별 번역 조회
 * - 기본 언어 설정
 *
 * @see {@link ./language-types} - 언어 타입 정의
 *
 * @example
 * ```typescript
 * import {
 *   TRANSLATION_REGISTRY,
 *   DEFAULT_LANGUAGE,
 *   getLanguageStrings,
 *   listBaseLanguages
 * } from '@shared/constants/i18n';
 *
 * // 현재 언어의 번역 조회
 * const strings = getLanguageStrings('ko');
 * console.log(strings.toolbar.previous);
 *
 * // 지원 언어 목록
 * const langs = listBaseLanguages(); // ['en', 'ko', 'ja']
 *
 * // 기본 언어
 * console.log(DEFAULT_LANGUAGE); // 'en'
 * ```
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
 *
 * @param language - 조회할 언어 코드
 * @returns 지정된 언어의 번역 문자열 객체
 *
 * @example
 * ```typescript
 * const koStrings = getLanguageStrings('ko');
 * const enStrings = getLanguageStrings('en');
 * ```
 */
export function getLanguageStrings(language: BaseLanguageCode): LanguageStrings {
  return TRANSLATION_REGISTRY[language];
}

/**
 * 지원하는 기본 언어 목록 반환 (읽기 전용)
 *
 * @returns 지원 언어 코드 배열 (읽기 전용)
 *
 * @example
 * ```typescript
 * const languages = listBaseLanguages();
 * // ['en', 'ko', 'ja']
 * ```
 */
export function listBaseLanguages(): readonly BaseLanguageCode[] {
  return LANGUAGE_CODES;
}
