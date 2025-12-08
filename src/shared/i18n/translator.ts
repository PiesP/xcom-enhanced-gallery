import type { BaseLanguageCode } from '@shared/constants/i18n/language-types';
import { LANGUAGE_CODES } from '@shared/constants/i18n/language-types';
import { TranslationCatalog, type TranslationCatalogOptions } from './translation-catalog';
import { resolveTranslationValue } from './translation-utils';
import type { TranslationKey, TranslationParams } from './types';

export interface TranslateOptions {
  readonly params?: TranslationParams;
  readonly language?: BaseLanguageCode;
}

export type TranslationFunction = (key: TranslationKey, params?: TranslationParams) => string;

export class Translator {
  private readonly catalog: TranslationCatalog;

  constructor(options: TranslationCatalog | TranslationCatalogOptions = {}) {
    this.catalog = options instanceof TranslationCatalog
      ? options
      : new TranslationCatalog(options);
  }

  /**
   * Get all available languages (loaded + lazy-loadable).
   */
  get languages(): BaseLanguageCode[] {
    return [...LANGUAGE_CODES];
  }

  /**
   * Ensure a language bundle is loaded before translation.
   * Call this when switching languages to preload the bundle.
   */
  async ensureLanguage(language: BaseLanguageCode): Promise<void> {
    await this.catalog.ensureLanguage(language);
  }

  translate(language: BaseLanguageCode, key: TranslationKey, params?: TranslationParams): string {
    const dictionary = this.catalog.get(language);
    const template = resolveTranslationValue(dictionary, key);

    if (!template) {
      return key;
    }

    if (!params) {
      return template;
    }

    return template.replace(/\{(\w+)\}/g, (_, placeholder: string) => {
      if (Object.hasOwn(params, placeholder)) {
        return String(params[placeholder]);
      }

      return `{${placeholder}}`;
    });
  }
}

export function createTranslationFunction(
  translator: Translator,
  resolveLanguage: () => BaseLanguageCode,
): TranslationFunction {
  return (key, params) => translator.translate(resolveLanguage(), key, params);
}
