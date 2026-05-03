/**
 * @fileoverview Translator — merged from TranslationCatalog, Translator, and translation-utils.
 * All language bundles are pre-loaded in the single-file userscript.
 */

import type { BaseLanguageCode, LanguageStrings } from '@shared/constants/i18n/i18n.types';
import { LANGUAGE_CODES } from '@shared/constants/i18n/i18n.types';
import { DEFAULT_LANGUAGE, TRANSLATION_REGISTRY } from '@shared/constants/i18n/translation-registry';
import type { TranslationBundleInput, TranslationKey, TranslationParams } from './types';

function resolveTranslationValue(dictionary: LanguageStrings, key: TranslationKey): string | undefined {
  const segments = key.split('.');
  let current: unknown = dictionary;
  for (const segment of segments) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'string' ? current : undefined;
}

interface TranslatorOptions {
  readonly bundles?: TranslationBundleInput;
  readonly fallbackLanguage?: BaseLanguageCode;
}

export class Translator {
  private readonly bundles: Partial<Record<BaseLanguageCode, LanguageStrings>> = {};
  private readonly fallbackLanguage: BaseLanguageCode;

  constructor(options: TranslatorOptions = {}) {
    const { bundles = TRANSLATION_REGISTRY, fallbackLanguage = DEFAULT_LANGUAGE } = options;
    this.fallbackLanguage = fallbackLanguage;
    for (const [lang, strings] of Object.entries(bundles) as Array<[BaseLanguageCode, LanguageStrings | undefined]>) {
      if (strings) this.bundles[lang] = strings;
    }
    if (!this.bundles[this.fallbackLanguage]) {
      throw new Error(`Missing fallback language bundle: ${this.fallbackLanguage}`);
    }
  }

  get languages(): BaseLanguageCode[] {
    return [...LANGUAGE_CODES];
  }

  public async ensureLanguage(_language: BaseLanguageCode): Promise<void> {}

  public translate(language: BaseLanguageCode, key: TranslationKey, params?: TranslationParams): string {
    const strings = this.bundles[language] ?? this.bundles[this.fallbackLanguage]!;
    const template = resolveTranslationValue(strings, key);
    if (!template) return key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, placeholder) =>
      Object.hasOwn(params, placeholder) ? String(params[placeholder]) : match,
    );
  }
}
