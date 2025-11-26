export type {
  BaseLanguageCode,
  LanguageStrings,
  SupportedLanguage,
} from '@shared/constants/i18n/language-types';
export { isBaseLanguageCode, LANGUAGE_CODES } from '@shared/constants/i18n/language-types';
export {
  DEFAULT_LANGUAGE,
  getLanguageStrings,
  TRANSLATION_REGISTRY,
} from '@shared/constants/i18n/translation-registry';
export { TranslationCatalog, type TranslationCatalogOptions } from './translation-catalog';
export { collectTranslationKeys, resolveTranslationValue } from './translation-utils';
export { createTranslationFunction, type TranslationFunction, Translator } from './translator';
export type {
  TranslationBundleInput,
  TranslationBundles,
  TranslationKey,
  TranslationParams,
} from './types';
