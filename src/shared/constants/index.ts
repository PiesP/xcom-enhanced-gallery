/**
 * @fileoverview 공유 상수 및 설정값 내보내기
 * @description Phase 225: i18n 시스템 통합
 * @version 2.0.0 - Phase 352: Named export 최적화
 * @see {@link ./i18n} - 다국어 지원 (language-types, translation-registry)
 *
 * @example
 * ```typescript
 * // i18n 관련 import
 * import {
 *   LANGUAGE_CODES,
 *   type SupportedLanguage,
 *   getLanguageStrings,
 *   TRANSLATION_REGISTRY
 * } from '@shared/constants';
 * ```
 */

export {
  LANGUAGE_CODES,
  isBaseLanguageCode,
  TRANSLATION_REGISTRY,
  DEFAULT_LANGUAGE,
  getLanguageStrings,
  moduleVersions,
  resolveModuleKeys,
  buildModuleVersions,
} from './i18n';

export type { BaseLanguageCode, SupportedLanguage, LanguageStrings } from './i18n';
