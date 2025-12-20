import type { BaseLanguageCode, LanguageStrings } from '@shared/constants/i18n/language-types';
import { LANGUAGE_CODES } from '@shared/constants/i18n/language-types';
import {
  DEFAULT_LANGUAGE,
  TRANSLATION_REGISTRY,
} from '@shared/constants/i18n/translation-registry';
import type { TranslationBundleInput } from './types';

export interface TranslationCatalogOptions {
  readonly bundles?: TranslationBundleInput;
  readonly fallbackLanguage?: BaseLanguageCode;
}

export class TranslationCatalog {
  private readonly bundles: Partial<Record<BaseLanguageCode, LanguageStrings>> = {};
  private readonly fallbackLanguage: BaseLanguageCode;

  constructor(options: TranslationCatalogOptions = {}) {
    const { bundles = TRANSLATION_REGISTRY, fallbackLanguage = DEFAULT_LANGUAGE } = options;
    this.fallbackLanguage = fallbackLanguage;
    this.registerBundles(bundles);

    if (!this.bundles[this.fallbackLanguage]) {
      throw new Error(`Missing fallback language bundle: ${this.fallbackLanguage}`);
    }
  }

  register(language: BaseLanguageCode, strings: LanguageStrings): void {
    this.bundles[language] = strings;
  }

  has(language: BaseLanguageCode): boolean {
    return Boolean(this.bundles[language]);
  }

  get(language?: BaseLanguageCode): LanguageStrings {
    if (language) {
      const strings = this.bundles[language];
      if (strings) {
        return strings;
      }
    }

    return this.bundles[this.fallbackLanguage]!;
  }

  /**
   * Ensure a language bundle is loaded.
   *
   * This userscript ships all language bundles synchronously in the single-file
   * output. Runtime lazy-loading is intentionally unsupported.
   */
  async ensureLanguage(language: BaseLanguageCode): Promise<boolean> {
    void language;
    return false;
  }

  /**
   * Check if a language can be lazy-loaded.
   */
  canLazyLoad(language: BaseLanguageCode): boolean {
    void language;
    return false;
  }

  keys(): BaseLanguageCode[] {
    return Object.keys(this.bundles) as BaseLanguageCode[];
  }

  /**
   * Get all available languages (loaded + lazy-loadable).
   */
  availableLanguages(): BaseLanguageCode[] {
    // Loaded + lazy-loadable languages are fixed for this userscript.
    return [...LANGUAGE_CODES];
  }

  toRecord(): TranslationBundleInput {
    return { ...this.bundles } as TranslationBundleInput;
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
