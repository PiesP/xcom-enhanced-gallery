/**
 * @fileoverview 다국어 시스템의 타입 정의 및 유효성 검사
 * @description Phase 225: i18n 타입 시스템 최적화
 * @version 2.0.0
 *
 * 주요 기능:
 * - 지원 언어 타입 정의 (BaseLanguageCode, SupportedLanguage)
 * - 번역 스키마 인터페이스 (LanguageStrings)
 * - 언어 코드 검증 유틸리티
 *
 * @see {@link ./translation-registry} - 번역 데이터 저장소
 *
 * @example
 * ```typescript
 * import {
 *   LANGUAGE_CODES,
 *   type BaseLanguageCode,
 *   type SupportedLanguage,
 *   type LanguageStrings,
 *   isBaseLanguageCode
 * } from '@shared/constants/i18n';
 *
 * // 언어 코드 검증
 * if (isBaseLanguageCode(userLang)) {
 *   const strings = getLanguageStrings(userLang);
 * }
 * ```
 */

export const LANGUAGE_CODES = ['en', 'ko', 'ja'] as const;
export type BaseLanguageCode = (typeof LANGUAGE_CODES)[number];
export type SupportedLanguage = 'auto' | BaseLanguageCode;

/**
 * 번역 문자열 스키마 (모든 언어가 준수해야 할 인터페이스)
 */
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

const LANGUAGE_CODE_LOOKUP = new Set<string>(LANGUAGE_CODES);

/**
 * 주어진 값이 유효한 기본 언어 코드인지 확인
 *
 * @param value - 검증할 값
 * @returns value가 BaseLanguageCode이면 true, 아니면 false
 *
 * @example
 * ```typescript
 * if (isBaseLanguageCode('en')) {
 *   // ✅ true - 유효한 언어 코드
 * }
 *
 * if (isBaseLanguageCode('de')) {
 *   // ❌ false - 지원하지 않는 언어 코드
 * }
 * ```
 */
export function isBaseLanguageCode(value: string | null | undefined): value is BaseLanguageCode {
  return value != null && LANGUAGE_CODE_LOOKUP.has(value);
}
