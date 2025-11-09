import { LANGUAGE_CODES, type BaseLanguageCode, type LanguageStrings } from './language-types';
import { DEFAULT_LANGUAGE, TRANSLATION_REGISTRY } from './translation-registry';

export type LanguageIntegrityReport = {
  missing: Record<BaseLanguageCode, string[]>;
  extra: Record<BaseLanguageCode, string[]>;
};

const collectKeys = (value: unknown, prefix = '', result: string[] = []): string[] => {
  if (!value || typeof value !== 'object') {
    return result;
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof nested === 'string') {
      result.push(path);
    } else {
      collectKeys(nested, path, result);
    }
  }

  return result;
};

export function createLanguageIntegrityReport(): LanguageIntegrityReport {
  const base: LanguageStrings = TRANSLATION_REGISTRY[DEFAULT_LANGUAGE];
  const baseKeys = new Set(collectKeys(base));
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
    const localeKeys = new Set(collectKeys(localeStrings));

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
