import type { BaseLanguageCode, LanguageStrings } from './language-types';
import { en } from './languages/en';
import { ja } from './languages/ja';
import { ko } from './languages/ko';

/**
 * Language bundles included in the userscript bundle.
 *
 * This project is shipped as a single-file userscript bundle (IIFE). Runtime
 * `import()` is forbidden to avoid accidental code-splitting and multi-file
 * outputs.
 *
 * @remarks
 * All supported languages must be statically imported and registered here.
 * Dynamic language loading is not supported due to userscript bundle constraints.
 */
export const TRANSLATION_REGISTRY: Partial<Record<BaseLanguageCode, LanguageStrings>> = {
  en,
  ko,
  ja,
} as const;

/**
 * Default fallback language when requested language is unavailable.
 *
 * @remarks
 * Must be a key present in TRANSLATION_REGISTRY. Currently set to English.
 */
export const DEFAULT_LANGUAGE: BaseLanguageCode = 'en';

/**
 * Get language strings synchronously for bundled languages.
 *
 * @param language - The language code to retrieve strings for
 * @returns Language strings for the requested language, or fallback to default language
 *
 * @remarks
 * Only works for languages statically bundled in TRANSLATION_REGISTRY.
 * Always returns valid LanguageStrings object - never null or undefined.
 *
 * @example
 * ```typescript
 * const koStrings = getLanguageStrings('ko');
 * const fallbackStrings = getLanguageStrings('unsupported' as BaseLanguageCode);
 * ```
 */
export function getLanguageStrings(language: BaseLanguageCode): LanguageStrings {
  const strings = TRANSLATION_REGISTRY[language];
  if (strings) {
    return strings;
  }

  // Fallback to default language if requested language not loaded
  const defaultStrings = TRANSLATION_REGISTRY[DEFAULT_LANGUAGE];

  // Type-safe: DEFAULT_LANGUAGE is guaranteed to be in TRANSLATION_REGISTRY
  if (!defaultStrings) {
    throw new Error(
      `Fatal: Default language '${DEFAULT_LANGUAGE}' not found in TRANSLATION_REGISTRY. ` +
        'This indicates a critical configuration error.'
    );
  }

  return defaultStrings;
}
