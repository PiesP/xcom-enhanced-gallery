import type { BaseLanguageCode, LanguageStrings } from '@shared/constants/i18n/language-types';
import { LANGUAGE_CODES } from '@shared/constants/i18n/language-types';
import {
  DEFAULT_LANGUAGE,
  TRANSLATION_REGISTRY,
} from '@shared/constants/i18n/translation-registry';
import type { TranslationBundleInput } from './types';

/**
 * Configuration options for TranslationCatalog
 */
export interface TranslationCatalogOptions {
  /**
   * Translation bundles indexed by language code
   * @default TRANSLATION_REGISTRY
   */
  readonly bundles?: TranslationBundleInput;
  /**
   * Language code to use when requested language is not available
   * @default DEFAULT_LANGUAGE
   */
  readonly fallbackLanguage?: BaseLanguageCode;
}

/**
 * Manages translation bundles for multiple languages with fallback support.
 *
 * All language bundles are shipped synchronously in the userscript output.
 * Runtime lazy-loading is intentionally unsupported to maintain single-file architecture.
 */
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

  /**
   * Register a translation bundle for a specific language.
   *
   * @param language - Language code for the bundle
   * @param strings - Translation strings for the language
   */
  public register(language: BaseLanguageCode, strings: LanguageStrings): void {
    this.bundles[language] = strings;
  }

  /**
   * Check if a language bundle is loaded.
   *
   * @param language - Language code to check
   * @returns true if the language bundle exists
   */
  public has(language: BaseLanguageCode): boolean {
    return !!this.bundles[language];
  }

  /**
   * Get translation strings for a language with fallback support.
   *
   * @param language - Requested language code (optional)
   * @returns Translation strings for requested language, or fallback language if not found
   */
  public get(language?: BaseLanguageCode): LanguageStrings {
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
   *
   * @param _language - Language code (unused)
   * @returns Always false (lazy-loading not supported)
   */
  public async ensureLanguage(_language: BaseLanguageCode): Promise<boolean> {
    return false;
  }

  /**
   * Check if a language can be lazy-loaded.
   *
   * @param _language - Language code (unused)
   * @returns Always false (lazy-loading not supported)
   */
  public canLazyLoad(_language: BaseLanguageCode): boolean {
    return false;
  }

  /**
   * Get list of currently loaded language codes.
   *
   * @returns Array of loaded language codes
   */
  public keys(): BaseLanguageCode[] {
    return Object.keys(this.bundles) as BaseLanguageCode[];
  }

  /**
   * Get all available languages (loaded + lazy-loadable).
   *
   * For this userscript, all languages are bundled and available immediately.
   *
   * @returns Array of all supported language codes
   */
  public availableLanguages(): readonly BaseLanguageCode[] {
    return LANGUAGE_CODES;
  }

  /**
   * Export catalog as a plain record object.
   *
   * @returns Translation bundles indexed by language code
   */
  public toRecord(): TranslationBundleInput {
    return { ...this.bundles } as TranslationBundleInput;
  }

  /**
   * Register multiple language bundles at once.
   *
   * @param bundles - Translation bundles indexed by language code
   */
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
