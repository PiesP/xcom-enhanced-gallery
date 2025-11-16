import {
  DEFAULT_LANGUAGE,
  TRANSLATION_REGISTRY,
} from '@shared/constants/i18n/translation-registry';
import type { BaseLanguageCode, LanguageStrings } from '@shared/constants/i18n/language-types';
import type { TranslationBundleInput } from './types';

export interface TranslationCatalogOptions {
  readonly bundles?: TranslationBundleInput;
  readonly fallbackLanguage?: BaseLanguageCode;
}

export class TranslationCatalog {
  private readonly bundles = new Map<BaseLanguageCode, LanguageStrings>();
  private readonly fallbackLanguage: BaseLanguageCode;

  constructor(options: TranslationCatalogOptions = {}) {
    const { bundles = TRANSLATION_REGISTRY, fallbackLanguage = DEFAULT_LANGUAGE } = options;
    this.fallbackLanguage = fallbackLanguage;
    this.registerBundles(bundles);

    if (!this.bundles.has(this.fallbackLanguage)) {
      throw new Error(`Missing fallback language bundle: ${this.fallbackLanguage}`);
    }
  }

  register(language: BaseLanguageCode, strings: LanguageStrings): void {
    this.bundles.set(language, strings);
  }

  has(language: BaseLanguageCode): boolean {
    return this.bundles.has(language);
  }

  get(language?: BaseLanguageCode): LanguageStrings {
    if (language && this.bundles.has(language)) {
      return this.bundles.get(language)!;
    }

    return this.bundles.get(this.fallbackLanguage)!;
  }

  keys(): BaseLanguageCode[] {
    return Array.from(this.bundles.keys());
  }

  toRecord(): TranslationBundleInput {
    return Object.fromEntries(this.bundles.entries()) as TranslationBundleInput;
  }

  private registerBundles(bundles: TranslationBundleInput): void {
    for (const [language, strings] of Object.entries(bundles) as Array<
      [BaseLanguageCode, LanguageStrings | undefined]
    >) {
      if (!strings) {
        continue;
      }
      this.register(language, strings);
    }
  }
}
