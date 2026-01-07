import type { BaseLanguageCode } from '@shared/constants/i18n/language-types';
import { LANGUAGE_CODES } from '@shared/constants/i18n/language-types';
import { TranslationCatalog, type TranslationCatalogOptions } from './translation-catalog';
import { resolveTranslationValue } from './translation-utils';
import type { TranslationKey, TranslationParams } from './types';

/**
 * Handles translation operations with parameter interpolation and fallback support.
 *
 * The Translator provides a simple API for retrieving translated strings with
 * dynamic parameter replacement. All language bundles are pre-loaded in the
 * single-file userscript bundle.
 *
 * @example
 * ```typescript
 * const translator = new Translator();
 * const text = translator.translate('en', 'msg.welcome.title');
 * const withParams = translator.translate('en', 'msg.greeting', { name: 'User' });
 * ```
 */
export class Translator {
  private readonly catalog: TranslationCatalog;

  /**
   * Creates a new Translator instance.
   *
   * @param options - Translation catalog or configuration options
   */
  constructor(options: TranslationCatalog | TranslationCatalogOptions = {}) {
    this.catalog =
      options instanceof TranslationCatalog ? options : new TranslationCatalog(options);
  }

  /**
   * Get all available language codes.
   *
   * Returns all language codes that are registered in the translation system.
   * All bundles are shipped synchronously in the userscript.
   *
   * @returns Array of available language codes
   */
  get languages(): BaseLanguageCode[] {
    return [...LANGUAGE_CODES];
  }

  /**
   * Ensure a language bundle is loaded.
   *
   * This userscript ships all language bundles synchronously in the single-file
   * output. Runtime lazy-loading is intentionally unsupported, so this method
   * exists for API compatibility but always returns immediately.
   *
   * @param language - Language code to ensure is loaded
   * @returns Promise that resolves immediately (no lazy-loading)
   */
  public async ensureLanguage(language: BaseLanguageCode): Promise<void> {
    await this.catalog.ensureLanguage(language);
  }

  /**
   * Translate a key to the target language with optional parameter interpolation.
   *
   * Retrieves the translation string for the given key in the specified language.
   * If parameters are provided, replaces `{placeholder}` patterns in the template
   * with corresponding parameter values.
   *
   * @param language - Target language code
   * @param key - Translation key in dot notation (e.g., 'msg.welcome.title')
   * @param params - Optional parameters for string interpolation
   * @returns Translated string with interpolated parameters, or the key itself if not found
   *
   * @example
   * ```typescript
   * // Simple translation
   * translator.translate('en', 'msg.welcome');
   * // => "Welcome"
   *
   * // With parameters
   * translator.translate('en', 'msg.greeting', { name: 'John', count: 5 });
   * // => "Hello John, you have 5 messages"
   * ```
   */
  public translate(
    language: BaseLanguageCode,
    key: TranslationKey,
    params?: TranslationParams
  ): string {
    const dictionary = this.catalog.get(language);
    const template = resolveTranslationValue(dictionary, key);

    // Return key as fallback if translation not found
    if (!template) {
      return key;
    }

    // Return template as-is if no parameter interpolation needed
    if (!params) {
      return template;
    }

    // Replace {placeholder} patterns with parameter values
    return template.replace(/\{(\w+)\}/g, (match: string, placeholder: string): string => {
      if (Object.hasOwn(params, placeholder)) {
        return String(params[placeholder]);
      }

      // Keep placeholder if parameter not provided
      return match;
    });
  }
}
