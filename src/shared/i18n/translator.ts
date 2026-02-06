import type { BaseLanguageCode } from '@shared/constants/i18n/i18n.types';
import { LANGUAGE_CODES } from '@shared/constants/i18n/i18n.types';
import { TranslationCatalog, type TranslationCatalogOptions } from './translation-catalog';
import { resolveTranslationValue } from './translation-utils';
import type { TranslationKey, TranslationParams } from './types';

/**
 * Translator with parameter interpolation and fallback support
 * All language bundles are pre-loaded in the single-file userscript
 */
export class Translator {
  private readonly catalog: TranslationCatalog;

  /**
   * Creates a new Translator instance
   * @param options - Translation catalog or configuration options
   */
  constructor(options: TranslationCatalog | TranslationCatalogOptions = {}) {
    this.catalog =
      options instanceof TranslationCatalog ? options : new TranslationCatalog(options);
  }

  /**
   * Get all available language codes (pre-loaded bundles)
   * @returns Array of available language codes
   */
  get languages(): BaseLanguageCode[] {
    return [...LANGUAGE_CODES];
  }

  /**
   * Ensure language bundle is loaded (lazy-loading not supported)
   * @param language - Language code to ensure
   * @returns Promise that resolves immediately
   */
  public async ensureLanguage(language: BaseLanguageCode): Promise<void> {
    await this.catalog.ensureLanguage(language);
  }

  /**
   * Translate key with optional parameter interpolation
   * @param language - Target language code
   * @param key - Translation key (dot notation)
   * @param params - Optional parameters for interpolation
   * @returns Translated string with interpolated parameters (key if not found)
   */
  public translate(
    language: BaseLanguageCode,
    key: TranslationKey,
    params?: TranslationParams
  ): string {
    const dictionary = this.catalog.get(language);
    const template = resolveTranslationValue(dictionary, key);

    if (!template) {
      return key;
    }

    if (!params) {
      return template;
    }

    return template.replace(/\{(\w+)\}/g, (match: string, placeholder: string): string => {
      if (Object.hasOwn(params, placeholder)) {
        return String(params[placeholder]);
      }
      return match;
    });
  }
}
