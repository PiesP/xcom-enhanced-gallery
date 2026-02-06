import type { BaseLanguageCode, LanguageStrings } from '@shared/constants/i18n/i18n.types';
import { LANGUAGE_CODES } from '@shared/constants/i18n/i18n.types';
import {
  DEFAULT_LANGUAGE,
  TRANSLATION_REGISTRY,
} from '@shared/constants/i18n/translation-registry';
import type { TranslationBundleInput } from './types';

/**
 * Configuration options for TranslationCatalog
 */
export interface TranslationCatalogOptions {
  readonly bundles?: TranslationBundleInput;
  readonly fallbackLanguage?: BaseLanguageCode;
}

/**
 * Manages translation bundles with fallback support (all bundles shipped synchronously)
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
   * Register a translation bundle for a language
   * @param language - Language code
   * @param strings - Translation strings
   */
  public register(language: BaseLanguageCode, strings: LanguageStrings): void {
    this.bundles[language] = strings;
  }

  /**
   * Check if a language bundle is loaded
   * @param language - Language code to check
   * @returns true if bundle exists
   */
  public has(language: BaseLanguageCode): boolean {
    return !!this.bundles[language];
  }

  /**
   * Get translation strings with fallback support
   * @param language - Requested language code (optional)
   * @returns Translation strings (fallback if not found)
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
   * Ensure language bundle is loaded (lazy-loading not supported)
   * @param _language - Language code (unused)
   * @returns Always false
   */
  public async ensureLanguage(_language: BaseLanguageCode): Promise<boolean> {
    return false;
  }

  /**
   * Check if lazy-loading is supported (not supported)
   * @param _language - Language code (unused)
   * @returns Always false
   */
  public canLazyLoad(_language: BaseLanguageCode): boolean {
    return false;
  }

  /**
   * Get list of currently loaded language codes
   * @returns Array of loaded language codes
   */
  public keys(): BaseLanguageCode[] {
    return Object.keys(this.bundles) as BaseLanguageCode[];
  }

  /**
   * Get all available languages (all bundled and available immediately)
   * @returns Array of all supported language codes
   */
  public availableLanguages(): readonly BaseLanguageCode[] {
    return LANGUAGE_CODES;
  }

  /**
   * Export catalog as plain record object
   * @returns Translation bundles indexed by language code
   */
  public toRecord(): TranslationBundleInput {
    return { ...this.bundles } as TranslationBundleInput;
  }

  /**
   * Register multiple language bundles at once
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
