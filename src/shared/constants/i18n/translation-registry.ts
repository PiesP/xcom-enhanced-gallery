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
 */
export const TRANSLATION_REGISTRY: Partial<Record<BaseLanguageCode, LanguageStrings>> =
  Object.freeze({
    en,
    ko,
    ja,
  });

export const DEFAULT_LANGUAGE: BaseLanguageCode = 'en';

/**
 * Reserved for legacy lazy-loading flows.
 *
 * Runtime `import()` is not allowed, so this map is intentionally empty.
 */
export const LAZY_LANGUAGE_LOADERS: Readonly<
  Partial<Record<Exclude<BaseLanguageCode, 'en'>, () => Promise<LanguageStrings>>>
> = Object.freeze({});

/**
 * Get language strings synchronously (only works for bundled languages).
 * For historical callers, TranslationCatalog.ensureLanguage() is a no-op.
 */
export function getLanguageStrings(language: BaseLanguageCode): LanguageStrings {
  const strings = TRANSLATION_REGISTRY[language];
  if (strings) {
    return strings;
  }
  // Fallback to default language if requested language not loaded
  return TRANSLATION_REGISTRY[DEFAULT_LANGUAGE]!;
}
