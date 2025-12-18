import type { BaseLanguageCode, LanguageStrings } from '@shared/constants/i18n/language-types';
import { LANGUAGE_CODES } from '@shared/constants/i18n/language-types';
import {
  DEFAULT_LANGUAGE,
  LAZY_LANGUAGE_LOADERS,
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
  private readonly loadingPromises: Partial<Record<BaseLanguageCode, Promise<void>>> = {};

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
   * Ensure a language bundle is loaded (lazy load if necessary).
   * Returns true if the language was loaded, false if it was already available.
   */
  async ensureLanguage(language: BaseLanguageCode): Promise<boolean> {
    // Already loaded
    if (this.bundles[language]) {
      return false;
    }

    // Check if there's a lazy loader for this language
    const loader = LAZY_LANGUAGE_LOADERS[language as keyof typeof LAZY_LANGUAGE_LOADERS];
    if (!loader) {
      return false;
    }

    // Deduplicate concurrent loads
    const existingPromise = this.loadingPromises[language];
    if (existingPromise) {
      await existingPromise;
      return true;
    }

    const loadPromise = (async () => {
      const strings = await loader();
      this.register(language, strings);
    })();

    this.loadingPromises[language] = loadPromise;

    try {
      await loadPromise;
      return true;
    } finally {
      delete this.loadingPromises[language];
    }
  }

  /**
   * Check if a language can be lazy-loaded.
   */
  canLazyLoad(language: BaseLanguageCode): boolean {
    return Boolean(LAZY_LANGUAGE_LOADERS[language as keyof typeof LAZY_LANGUAGE_LOADERS]);
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
