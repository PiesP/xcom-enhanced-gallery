import type { BaseLanguageCode, LanguageStrings } from '@shared/constants/i18n/language-types';
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
  private readonly bundles = new Map<BaseLanguageCode, LanguageStrings>();
  private readonly fallbackLanguage: BaseLanguageCode;
  private readonly loadingPromises = new Map<BaseLanguageCode, Promise<void>>();

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

  /**
   * Ensure a language bundle is loaded (lazy load if necessary).
   * Returns true if the language was loaded, false if it was already available.
   */
  async ensureLanguage(language: BaseLanguageCode): Promise<boolean> {
    // Already loaded
    if (this.bundles.has(language)) {
      return false;
    }

    // Check if there's a lazy loader for this language
    const loader = LAZY_LANGUAGE_LOADERS[language as keyof typeof LAZY_LANGUAGE_LOADERS];
    if (!loader) {
      return false;
    }

    // Deduplicate concurrent loads
    const existingPromise = this.loadingPromises.get(language);
    if (existingPromise) {
      await existingPromise;
      return true;
    }

    const loadPromise = (async () => {
      const strings = await loader();
      this.register(language, strings);
    })();

    this.loadingPromises.set(language, loadPromise);

    try {
      await loadPromise;
      return true;
    } finally {
      this.loadingPromises.delete(language);
    }
  }

  /**
   * Check if a language can be lazy-loaded.
   */
  canLazyLoad(language: BaseLanguageCode): boolean {
    return language in LAZY_LANGUAGE_LOADERS;
  }

  keys(): BaseLanguageCode[] {
    return Array.from(this.bundles.keys());
  }

  /**
   * Get all available languages (loaded + lazy-loadable).
   */
  availableLanguages(): BaseLanguageCode[] {
    const loaded = new Set(this.bundles.keys());
    const lazyLoadable = Object.keys(LAZY_LANGUAGE_LOADERS) as BaseLanguageCode[];
    for (const lang of lazyLoadable) {
      loaded.add(lang);
    }
    return Array.from(loaded);
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
