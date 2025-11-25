import type { BaseLanguageCode } from '@shared/constants/i18n/language-types';
import type { TranslationKey, TranslationParams } from './types';
import { TranslationCatalog, type TranslationCatalogOptions } from './translation-catalog';
import { resolveTranslationValue } from './translation-utils';

export interface TranslateOptions {
  readonly params?: TranslationParams;
  readonly language?: BaseLanguageCode;
}

export type TranslationFunction = (key: TranslationKey, params?: TranslationParams) => string;

export class Translator {
  private readonly catalog: TranslationCatalog;

  constructor(options: TranslationCatalog | TranslationCatalogOptions = {}) {
    this.catalog =
      options instanceof TranslationCatalog ? options : new TranslationCatalog(options);
  }

  get languages(): BaseLanguageCode[] {
    return this.catalog.keys();
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
      if (Object.prototype.hasOwnProperty.call(params, placeholder)) {
        return String(params[placeholder]);
      }

      return `{${placeholder}}`;
    });
  }
}

export function createTranslationFunction(
  translator: Translator,
  resolveLanguage: () => BaseLanguageCode
): TranslationFunction {
  return (key, params) => translator.translate(resolveLanguage(), key, params);
}
