export type {
  TranslationKey,
  TranslationParams,
  TranslationBundles,
  TranslationBundleInput,
} from "./types";
export {
  TranslationCatalog,
  type TranslationCatalogOptions,
} from "./translation-catalog";
export {
  Translator,
  createTranslationFunction,
  type TranslationFunction,
} from "./translator";
export {
  collectTranslationKeys,
  resolveTranslationValue,
} from "./translation-utils";

export {
  LANGUAGE_CODES,
  isBaseLanguageCode,
} from "@shared/constants/i18n/language-types";
export type {
  BaseLanguageCode,
  SupportedLanguage,
  LanguageStrings,
} from "@shared/constants/i18n/language-types";
export {
  DEFAULT_LANGUAGE,
  TRANSLATION_REGISTRY,
  getLanguageStrings,
} from "@shared/constants/i18n/translation-registry";
