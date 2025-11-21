import { LANGUAGE_CODES, type BaseLanguageCode, type LanguageStrings } from './language-types';
import { DEFAULT_LANGUAGE, TRANSLATION_REGISTRY } from './translation-registry';
import { collectTranslationKeys } from '@shared/i18n/translation-utils';

export type LanguageIntegrityReport = {
  missing: Record<BaseLanguageCode, string[]>;
  extra: Record<BaseLanguageCode, string[]>;
};

export function createLanguageIntegrityReport(): LanguageIntegrityReport {
  const base: LanguageStrings = TRANSLATION_REGISTRY[DEFAULT_LANGUAGE];
  const baseKeys = new Set(collectTranslationKeys(base));
  const missing: Record<BaseLanguageCode, string[]> = {
    en: [],
    ko: [],
    ja: [],
  };
  const extra: Record<BaseLanguageCode, string[]> = {
    en: [],
    ko: [],
    ja: [],
  };

  for (const locale of LANGUAGE_CODES) {
    const localeStrings: LanguageStrings = TRANSLATION_REGISTRY[locale];
    const localeKeys = new Set(collectTranslationKeys(localeStrings));

    for (const key of baseKeys) {
      if (!localeKeys.has(key)) {
        missing[locale].push(key);
      }
    }

    for (const key of localeKeys) {
      if (!baseKeys.has(key)) {
        extra[locale].push(key);
      }
    }
  }

  return { missing, extra };
}
